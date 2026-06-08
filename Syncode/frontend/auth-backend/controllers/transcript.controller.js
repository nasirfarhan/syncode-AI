import { prisma } from "../lib/prisma.js";
import { v4 as uuid } from "uuid";
import { processTranscript } from "../services/transcriptProcessing.service.js";

const ALLOWED_SERVICES = ["full-pipeline", "audit-only", "compliance-only"];
const MAX_CASEID_ATTEMPTS = 3;

const normalizeCaseId = (caseId) => {
  if (!caseId) return null;
  const trimmed = caseId.trim();
  return trimmed.length ? trimmed : null;
};

const generateCaseId = () => `CASE-${uuid().slice(0, 8).toUpperCase()}`;

// Create a new transcript and initialize its processing status
export const createTranscript = async (req, res) => {
  try {
    const { rawText, caseId, insuranceProvider, policyType, service } =
      req.body;

    const files = req.files;

    if ((!files || files.length === 0) && !rawText) {
      return res.status(400).json({ error: "No input provided" });
    }

    if (!insuranceProvider?.trim()) {
      return res.status(400).json({ error: "insuranceProvider is required" });
    }

    if (!policyType?.trim()) {
      return res.status(400).json({ error: "policyType is required" });
    }

    if (service && !ALLOWED_SERVICES.includes(service)) {
      return res.status(400).json({
        error: `Invalid service. Allowed values: ${ALLOWED_SERVICES.join(
          ", "
        )}`,
      });
    }

    const inputType = files && files.length > 0 ? "FILE" : "TEXT";

    const filePaths = files
      ? files.map((file) => file.path.replace(/\\/g, "/"))
      : [];

    let resolvedCaseId = normalizeCaseId(caseId) || generateCaseId();
    let transcript = null;

    for (let attempt = 0; attempt < MAX_CASEID_ATTEMPTS; attempt += 1) {
      try {
        transcript = await prisma.transcript.create({
          data: {
            transcriptId: uuid(),
            inputType,
            filePaths,
            rawText: rawText || null,
            caseId: resolvedCaseId,
            insuranceProvider: insuranceProvider.trim(),
            policyType: policyType.trim(),
            service: service || "full-pipeline",
            userId: req.user.id,
            status: "PROCESSING",

            processingStatus: {
              create: {
                service: service || "full-pipeline",
                progress: 0,
                currentStep: "",
                steps: [],
              },
            },
          },
          include: { processingStatus: true },
        });
        break;
      } catch (err) {
        if (err?.code === "P2002" && err?.meta?.target?.includes("caseId")) {
          resolvedCaseId = generateCaseId();
          continue;
        }
        throw err;
      }
    }

    if (!transcript) {
      return res.status(409).json({
        error: "Unable to generate a unique Case ID. Please try again.",
      });
    }

    setImmediate(() => {
      processTranscript(transcript).catch((err) => {
        console.error("Transcript processing failed:", err);
      });
    });

    return res.status(201).json({
      id: transcript.id,
      transcriptId: transcript.transcriptId,
      caseId: transcript.caseId,
    });
  } catch (error) {
    console.error("Create transcript error:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "caseId already exists. Use a unique Case ID.",
      });
    }
    return res.status(500).json({
      error: error?.message || "Internal server error",
    });
  }
};

// Update the processing status of a transcript
export const updateProcessingStatus = async (req, res) => {
  try {
    const { transcriptId, service, progress, currentStep, steps } = req.body;

    const transcript = await prisma.transcript.findUnique({
      where: { transcriptId },
    });

    if (!transcript)
      return res.status(404).json({ error: "Transcript not found" });

    await prisma.processingStatus.upsert({
      where: { transcriptId: transcript.id },
      update: { progress, currentStep, steps, service },
      create: {
        transcriptId: transcript.id,
        service,
        progress,
        currentStep,
        steps,
      },
    });

    // Auto-mark transcript as completed
    if (progress === 100) {
      await prisma.transcript.update({
        where: { id: transcript.id },
        data: { status: "COMPLETED" },
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Update processing status error:", err);
    res.status(500).json({ error: "Status update failed" });
  }
};

// Get current processing status of a transcript
export const getProcessingStatus = async (req, res) => {
  try {
    const { transcriptId } = req.params;

    const transcript = await prisma.transcript.findUnique({
      where: { transcriptId },
      include: { processingStatus: true },
    });

    if (!transcript) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    // If no processingStatus exists yet, return defaults
    const status = transcript.processingStatus || {
      progress: 0,
      currentStep: "",
      steps: [],
      service: transcript.service || "full-pipeline",
    };

    return res.json({
      service: status.service,
      progress: status.progress,
      currentStep: status.currentStep,
      steps: status.steps,
      status: transcript.status,
      metadata: {
        caseId: transcript.caseId,
        insuranceProvider: transcript.insuranceProvider,
        policyType: transcript.policyType,
      },
      files: transcript.filePaths || [],
    });
  } catch (err) {
    console.error("Get processing status error:", err);
    res.status(500).json({ error: "Failed to fetch status" });
  }
};
