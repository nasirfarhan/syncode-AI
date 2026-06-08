import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_AUTH_BACKEND_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Login failed");
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#11d462]/5 border border-[#11d462] rounded-xl p-8 shadow-[0_10px_30px_rgba(17,212,98,0.35)]"
      >
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-yellow-500">Sign In</h1>
          <p className="text-muted-foreground mt-2">Access your account</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2 text-foreground">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:border-[#11d462] focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-foreground">
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:border-[#11d462] focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-[#0e8f45] bg-transparent hover:underline hover:bg-transparent"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-primary-foreground rounded-xl bg-yellow-500 transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-muted-foreground">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-[#0e8f45] hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
