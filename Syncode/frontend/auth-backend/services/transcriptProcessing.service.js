import { prisma } from "../lib/prisma.js";
import { requestIngestion } from "./ingestion.service.js";

const DEFAULT_STEPS = [
  { name: "Ingestion", description: "Analyzing transcript", status: "PENDING" },
  { name: "Code Extraction", description: "Matching ICD codes", status: "PENDING" },
  { name: "Finalize", description: "Saving results", status: "PENDING" },
];

async function upsertProcessingStatus({
  transcript,
  progress,
  currentStep,
  steps,
}) {
  await prisma.processingStatus.upsert({
    where: { transcriptId: transcript.id },
    update: { progress, currentStep, steps, service: transcript.service },
    create: {
      transcriptId: transcript.id,
      service: transcript.service || "full-pipeline",
      progress,
      currentStep,
      steps,
    },
  });
}

async function markTranscriptStatus(transcriptId, status) {
  await prisma.transcript.update({
    where: { id: transcriptId },
    data: { status },
  });
}

export async function processTranscript(transcript) {
  const steps = DEFAULT_STEPS.map((step) => ({ ...step }));

  try {
    steps[0].status = "IN_PROGRESS";
    await upsertProcessingStatus({
      transcript,
      progress: 10,
      currentStep: steps[0].name,
      steps,
    });

    const aiCodes = await requestIngestion({
      rawText: transcript.rawText || "",
      filePaths: transcript.filePaths || [],
    });

    steps[0].status = "DONE";
    steps[1].status = "IN_PROGRESS";
    await upsertProcessingStatus({
      transcript,
      progress: 60,
      currentStep: steps[1].name,
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
      throw new Error("AI ingestion returned no codes");
    }

    await prisma.medicalCode.createMany({ data: mappedCodes });

    steps[1].status = "DONE";
    steps[2].status = "IN_PROGRESS";
    await upsertProcessingStatus({
      transcript,
      progress: 90,
      currentStep: steps[2].name,
      steps,
    });

    await markTranscriptStatus(transcript.id, "COMPLETED");

    steps[2].status = "DONE";
    await upsertProcessingStatus({
      transcript,
      progress: 100,
      currentStep: "Completed",
      steps,
    });
  } catch (error) {
    steps.forEach((step) => {
      if (step.status === "IN_PROGRESS") {
        step.status = "FAILED";
      }
    });

    await upsertProcessingStatus({
      transcript,
      progress: 100,
      currentStep: "Failed",
      steps,
    });

    await markTranscriptStatus(transcript.id, "FAILED");

    throw error;
  }
}
