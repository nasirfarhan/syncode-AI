import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2 } from "lucide-react";

const fieldClass =
  "w-full px-4 py-3 bg-input text-foreground border border-border rounded-lg focus:bg-input focus:border-[#0e8f45] focus:outline-none focus:ring-1 focus:ring-[#0e8f45] transition";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: "",
    registrationNumber: "",
    country: "India",
    state: "",
    industryType: "",
    fullName: "",
    email: "",
    mobile: "",
    designation: "",
    password: "",
    confirmPassword: "",
    acceptedNDA: false,
    acceptedDataConsent: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const isCompanyComplete =
    formData.companyName &&
    formData.registrationNumber &&
    formData.state &&
    formData.industryType;

  const isAdminComplete =
    formData.fullName &&
    formData.email &&
    formData.mobile &&
    formData.designation &&
    formData.password &&
    formData.password === formData.confirmPassword &&
    formData.acceptedNDA &&
    formData.acceptedDataConsent;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isCompanyComplete || !isAdminComplete) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_AUTH_BACKEND_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Signup failed");
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        layout
        className={`w-full transition-all duration-500 shadow-[0_10px_30px_rgba(17,212,98,0.35)] ${
          isCompanyComplete ? "max-w-5xl" : "max-w-md"
        } bg-[#11d462]/5 border border-[#11d462] rounded-xl p-8`}
      >
        {/* HEADER */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-yellow-500">Sign Up</h1>
          <p className="text-muted-foreground mt-2">
            Register your company to get started
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className={`grid gap-8 ${
              isCompanyComplete ? "md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* COMPANY FORM */}
            <div className="space-y-4">
              <h3 className="text-lg text-foreground mb-2">
                Company Information
              </h3>

              <Input
                icon={Building2}
                label="Company Name"
                name="companyName"
                onChange={handleChange}
              />

              <Input
                label="Registration Number"
                name="registrationNumber"
                onChange={handleChange}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={fieldClass}
                >
                  <option className="bg-green-800 text-white">India</option>
                  <option className="bg-green-800 text-white">USA</option>
                  <option className="bg-green-800 text-white">UK</option>
                </select>

                <input
                  name="state"
                  placeholder="State"
                  onChange={handleChange}
                  className={fieldClass}
                />
              </div>

              <select
                name="industryType"
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="" className="bg-green-800 text-white">
                  Select Industry
                </option>
                <option value="medical" className="bg-green-800 text-white">
                  Medical Coding
                </option>
                <option value="audit" className="bg-green-800 text-white">
                  Audit
                </option>
              </select>
            </div>

            {/* ADMIN FORM */}
            <AnimatePresence>
              {isCompanyComplete && (
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg text-foreground mb-2">
                    Admin User Details
                  </h3>

                  <Input
                    label="Full Name"
                    name="fullName"
                    onChange={handleChange}
                  />
                  <Input
                    label="Work Email"
                    type="email"
                    name="email"
                    onChange={handleChange}
                  />
                  <Input label="Mobile" name="mobile" onChange={handleChange} />
                  <Input
                    label="Designation"
                    name="designation"
                    onChange={handleChange}
                  />
                  <Input
                    type="password"
                    label="Password"
                    name="password"
                    onChange={handleChange}
                  />
                  <Input
                    type="password"
                    label="Confirm Password"
                    name="confirmPassword"
                    onChange={handleChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkboxes */}
          {isCompanyComplete && (
            <div className="space-y-2 mt-2 mb-2">
              <Checkbox
                label="I consent to data processing as per DPDP Act and company privacy policy"
                name="acceptedDataConsent"
                onChange={handleChange}
              />
              <Checkbox
                label="I accept the NDA and terms of service"
                name="acceptedNDA"
                onChange={handleChange}
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <button
            type="submit"
            disabled={!isCompanyComplete || !isAdminComplete || loading}
            className="w-full mt-2 py-4 text-primary-foreground rounded-lg bg-yellow-500 transition"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-muted-foreground mt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-[#0e8f45] hover:underline">
              Login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

/* Helpers */
const Input = ({ label, icon: Icon, ...props }) => (
  <div>
    <label className="block text-sm mb-2 text-foreground">
      {Icon && <Icon className="inline w-4 h-4 mr-2" />}
      {label}
    </label>
    <input {...props} required className={fieldClass} />
  </div>
);

const Checkbox = ({ label, ...props }) => (
  <div className="flex items-center space-x-2 justify-start">
    <input type="checkbox" {...props} className="w-4 h-4 accent-[#0e8f45]" />
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);
