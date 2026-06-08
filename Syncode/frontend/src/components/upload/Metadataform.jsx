import { Card } from "../ui/card";

export const MetadataForm = ({ metadata, setMetadata }) => {
  return (
    <Card className="p-6 space-y-4 bg-[#11d4620D] border border-[#11d462] rounded-xl">
      <h3 className="text-lg font-semibold">Case Metadata</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2">Case ID (optional)</label>
          <input
            value={metadata.caseId}
            onChange={(e) =>
              setMetadata({ ...metadata, caseId: e.target.value })
            }
            className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:border-[#11d462] focus:outline-none focus:ring-1 focus:ring-[#11d462]"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Insurance Provider</label>
          <input
            value={metadata.insuranceProvider}
            onChange={(e) =>
              setMetadata({ ...metadata, insuranceProvider: e.target.value })
            }
            className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:border-[#11d462] focus:outline-none focus:ring-1 focus:ring-[#11d462]"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Policy Type</label>
          <select
            value={metadata.policyType}
            onChange={(e) =>
              setMetadata({ ...metadata, policyType: e.target.value })
            }
            className="w-full px-4 py-3 bg-input text-foreground border border-border rounded-xl focus:border-[#11d462] focus:outline-none focus:ring-1 focus:ring-[#11d462]"
          >
            <option value="" className="bg-green-800 text-white">
              Select
            </option>
            <option className="bg-green-800 text-white" value="health">
              Health Insurance
            </option>
            <option className="bg-green-800 text-white" value="life">
              Life Insurance
            </option>
            <option
              className="bg-green-800 text-white"
              value="critical-illness"
            >
              Critical Illness
            </option>
            <option
              className="bg-green-800 text-white"
              value="personal-accident"
            >
              Personal Accident
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-2">Service</label>
          <select
            value={metadata.service}
            onChange={(e) =>
              setMetadata({ ...metadata, service: e.target.value })
            }
            className="w-full px-4 py-3 bg-input text-foreground border border-border rounded-xl focus:border-[#11d462] focus:outline-none focus:ring-1 focus:ring-[#11d462]"
          >
            <option value="disabled">Select</option>
            <option className="bg-green-800 text-white" value="full-pipeline">
              Full Pipeline(All Services)
            </option>
            <option className="bg-green-800 text-white" value="audit-only">
              Audit Only
            </option>
            <option className="bg-green-800 text-white" value="compliance-only">
              Compliance Only
            </option>
          </select>
        </div>
      </div>
    </Card>
  );
};
