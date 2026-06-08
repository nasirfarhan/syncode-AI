import { PrismaClient } from "@prisma/client";
import { requestIngestion } from "../services/ingestion.service.js";

const prisma = new PrismaClient();

async function updateProcessingStatus({ transcriptId, service, progress, currentStep, steps }) {
  const statusUrl = process.env.PROCESSING_STATUS_URL;
  if (!statusUrl) {
    return;
  }

  const headers = { "Content-Type": "application/json" };
  const apiKey = process.env.INTERNAL_API_KEY;
  if (apiKey) {
    headers["x-internal-api-key"] = apiKey;
  }

  await fetch(statusUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ transcriptId, service, progress, currentStep, steps }),
  });
}

export const getResultsByCaseId = async (req, res) => {
  const { caseId } = req.params;

  try {
    const transcript = await prisma.transcript.findFirst({
      where: { caseId },
      include: { medicalCodes: true },
    });

    if (!transcript) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    if (transcript.status === "PROCESSING" && transcript.medicalCodes.length === 0) {
      return res.status(202).json({
        error: "Transcript is still processing",
        medicalCodes: [],
      });
    }

    let medicalCodes = transcript.medicalCodes;

    // If no codes yet, call AI model
    if (!medicalCodes || medicalCodes.length === 0) {
      try {
        const steps = [
          { name: "Ingestion", description: "Analyzing transcript", status: "IN_PROGRESS" },
          { name: "Code Extraction", description: "Matching ICD codes", status: "PENDING" },
          { name: "Finalize", description: "Saving results", status: "PENDING" },
        ];

        await updateProcessingStatus({
          transcriptId: transcript.transcriptId,
          service: transcript.service || "full-pipeline",
          progress: 10,
          currentStep: "Ingestion",
          steps,
        });

        const aiCodes = await requestIngestion({
          rawText: transcript.rawText || "",
          filePaths: transcript.filePaths || [],
        });

        steps[0].status = "DONE";
        steps[1].status = "IN_PROGRESS";

        await updateProcessingStatus({
          transcriptId: transcript.transcriptId,
          service: transcript.service || "full-pipeline",
          progress: 60,
          currentStep: "Code Extraction",
          steps,
        });

        const mappedCodes = (aiCodes || [])
          .map((c) => ({
            transcriptId: transcript.id,
            code: c.code || c.icd_code,
            description: c.description || c.name || null,
            type: c.type || "ICD-10",
          }))
          .filter((c) => c.code);

        if (mappedCodes.length === 0) {
          return res.status(502).json({
            error: "AI ingestion returned no codes",
            medicalCodes: [],
          });
        }

        // Save AI codes to DB
        await prisma.medicalCode.createMany({
          data: mappedCodes,
        });

        steps[1].status = "DONE";
        steps[2].status = "IN_PROGRESS";

        await updateProcessingStatus({
          transcriptId: transcript.transcriptId,
          service: transcript.service || "full-pipeline",
          progress: 90,
          currentStep: "Finalize",
          steps,
        });

        // Fetch saved codes
        medicalCodes = await prisma.medicalCode.findMany({
          where: { transcriptId: transcript.id },
        });

        steps[2].status = "DONE";
        await updateProcessingStatus({
          transcriptId: transcript.transcriptId,
          service: transcript.service || "full-pipeline",
          progress: 100,
          currentStep: "Completed",
          steps,
        });
      } catch (err) {
        return res.status(501).json({
          error: err.message || "AI ingestion is not available",
          medicalCodes: [],
        });
      }
    }

    res.json({ medicalCodes });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch results",
      medicalCodes: [],
    });
  }
};
