import { useEffect, useState } from "react";
import { UploadZone } from "@/components/upload/UploadZone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import { FileText, Folder, Paintbrush } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import { MetadataForm } from "@/components/upload/Metadataform";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const Upload = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [transcriptFiles, setTranscriptFiles] = useState([]);
  const [transcriptStatus, setTranscriptStatus] = useState("idle");
  const [transcriptText, setTranscriptText] = useState("");

  const [metadata, setMetadata] = useState({
    caseId: "",
    insuranceProvider: "",
    policyType: "",
    service: "",
  });

  /* ---------------- Validation ---------------- */

  const allowedServices = [
    "full-pipeline",
    "audit-only",
    "compliance-only",
  ];

  const isMetadataValid =
    metadata.insuranceProvider.trim() !== "" &&
    metadata.policyType.trim() !== "" &&
    (metadata.service === "" || allowedServices.includes(metadata.service));

  const hasFiles = transcriptFiles.length > 0;
  const hasText = transcriptText.trim().length > 0;
  const canUpload = (hasFiles || hasText) && isMetadataValid;

  const validateFiles = (files) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not allowed`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 50MB`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleUploadStart = async () => {
    if (!hasFiles && !hasText) {
      toast({
        title: "No input provided",
        description: "Upload a file or enter text to continue",
        variant: "destructive",
      });
      return;
    }

    if (!isMetadataValid) {
      toast({
        title: "Missing metadata",
        description: "Please fill in all required metadata fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();

      transcriptFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (hasText) {
        formData.append("rawText", transcriptText);
      }

      formData.append("caseId", metadata.caseId);
      formData.append("insuranceProvider", metadata.insuranceProvider);
      formData.append("policyType", metadata.policyType);
      formData.append("service", metadata.service);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/transcripts/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast({
        title: "Upload started",
        description: "Transcript is being processed",
      });

      navigate(`/processing/${data.transcriptId}`);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (transcriptFiles.length === 0) {
      setTranscriptStatus("idle");
      return;
    }

    if (!validateFiles(transcriptFiles)) {
      setTranscriptFiles([]);
      setTranscriptStatus("error");
      return;
    }

    setTranscriptStatus("success");
  }, [transcriptFiles]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200 flex flex-col">
      <Navbar showNavLinks={false} />
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between ">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Upload Medical Transcript
            </h1>
            <p className="text-slate-300">
              Upload documents for AI-powered medical code extraction and
              processing
            </p>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto p-6 space-y-6 ">
          <Tabs defaultValue="transcript" className="w-full">
            <TabsContent value="transcript" className="mt-0">
              <UploadZone
                title="Medical Transcript Document"
                accept=".pdf,.docx,.txt"
                files={transcriptFiles}
                onFileSelect={setTranscriptFiles}
                onTextChange={setTranscriptText}
                status={transcriptStatus}
              />
            </TabsContent>
          </Tabs>
          <MetadataForm metadata={metadata} setMetadata={setMetadata} />{" "}
          {transcriptFiles && (
            <Card className="p-4 bg-[#11d4620D] border border-[#11d462] rounded-3xl mt-4 flex justify-end">
              <Button
                onClick={handleUploadStart}
                disabled={!canUpload}
                className={cn(
                  "gap-2 bg-[#11d462] hover:scale-110 hover:bg-[#11d462]",
                  !canUpload && "opacity-50 cursor-not-allowed"
                )}
              >
                Upload & Start Processing
              </Button>
            </Card>
          )}
          {/* Upload Guidelines Card */}
          {(transcriptStatus === "idle" || transcriptStatus === "error") && (
            <Card className="p-6 mt-10 bg-[#11d4620D] border border-[#11d462] rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 flex items-center justify-center bg-[#11d46233] text-[#11d462] rounded-full text-xl font-bold">
                  ?
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Upload Guidelines
                </h2>
              </div>

              <div className="space-y-4 text-slate-300 text-sm">
                {/* Accepted file types */}
                <div>
                  <p className="font-medium text-white flex items-center gap-2">
                    <Folder className="h-4 w-4 text-primary" />
                    Accepted file types
                  </p>
                  <p className="text-slate-300 pl-6">PDF, DOCX, TXT</p>
                </div>

                {/* Max file size */}
                <div>
                  <p className="font-medium text-white flex items-center gap-2">
                    <Paintbrush className="h-4 w-4 text-primary" />
                    Max file size
                  </p>
                  <p className="pl-6 text-slate-300">50MB per file</p>
                </div>

                {/* Sample transcript */}
                <div>
                  <p className="font-medium text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Sample Transcript
                  </p>

                  <a
                    download="sample-transcript.txt"
                    href="data:text/plain;charset=utf-8,Sample%20Transcript%20Data%20Goes%20Here..."
                    className="pl-6 text-primary underline hover:text-secondary transition-colors"
                  >
                    Download sample file
                  </a>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
