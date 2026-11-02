import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Shield,
  Phone,
  Building2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ initialTab = "admin" }) {
  const { login } = useAuth();

  const [activeRole, setActiveRole] = useState(initialTab); // 'admin' | 'call_center' | 'marriage_client'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Mouse position for interactive spotlight and parallax
  const [mousePos, setMousePos] = useState({ x: null, y: null });
  const canvasRef = useRef(null);

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setErrorMessage("");
    setShowPassword(false);
    setIdentifier("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await login(identifier, password);
    } catch (err) {
      setErrorMessage(
        err.message || "Invalid credentials. Please check your username and password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Interactive Particle & Constellation Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse coordinates relative to window
    const mouse = { x: null, y: null, radius: 150 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
      setMousePos({ x: null, y: null });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Particle definition
    const PARTICLE_COUNT = Math.min(80, Math.floor((width * height) / 14000));
    const particles = [];
    const ripples = [];

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 2 + 1.2;
        this.baseAlpha = Math.random() * 0.45 + 0.25;
        this.alpha = this.baseAlpha;
        this.isGold = Math.random() > 0.65; // Mix of emerald green and warm golden stars
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap edges smoothly
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Interactive mouse physics
        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (1 - dist / mouse.radius) * 3.5;
            this.x += (dx / dist) * force;
            this.y += (dy / dist) * force;
            this.alpha = Math.min(1, this.baseAlpha + (1 - dist / mouse.radius) * 0.5);
          } else {
            this.alpha = this.baseAlpha;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isGold
          ? `rgba(251, 191, 36, ${this.alpha})`
          : `rgba(132, 224, 48, ${this.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.isGold
          ? "rgba(251, 191, 36, 0.6)"
          : "rgba(132, 224, 48, 0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Interactive click ripple
    const handleClick = (e) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 5,
        maxRadius: 130,
        alpha: 0.7,
      });
    };
    window.addEventListener("click", handleClick);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw connecting constellation lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxLineDist = 110;

          if (dist < maxLineDist) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const lineAlpha = (1 - dist / maxLineDist) * 0.16;
            ctx.strokeStyle = `rgba(132, 224, 48, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 2. Draw & update particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // 3. Draw & update interactive ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 3.5;
        r.alpha = Math.max(0, 0.7 * (1 - r.radius / r.maxRadius));

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(132, 224, 48, ${r.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#071913] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-slate-800 relative overflow-hidden select-none">
      {/* 1. Base Gradient Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0f2e23] via-[#071913] to-[#040e0b] pointer-events-none" />

      {/* 2. Interactive Spotlight that tracks cursor */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background:
            mousePos.x !== null
              ? `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(34, 197, 94, 0.18), rgba(16, 185, 129, 0.05) 45%, transparent 70%)`
              : "radial-gradient(800px circle at 50% 50%, rgba(34, 197, 94, 0.12), transparent 70%)",
        }}
      />

      {/* 3. Ambient Glowing Animated Orbs */}
      <div
        className="absolute top-1/4 -left-20 w-96 h-96 bg-[#eedfc8]/15 rounded-full blur-3xl pointer-events-none animate-floatSlow"
        style={{
          transform:
            mousePos.x !== null
              ? `translate(${(mousePos.x - window.innerWidth / 2) * -0.02}px, ${(mousePos.y - window.innerHeight / 2) * -0.02}px)`
              : undefined,
        }}
      />
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-floatSlow"
        style={{
          transform:
            mousePos.x !== null
              ? `translate(${(mousePos.x - window.innerWidth / 2) * 0.03}px, ${(mousePos.y - window.innerHeight / 2) * 0.03}px)`
              : undefined,
        }}
      />

      {/* 4. Interactive HTML5 Canvas (Particles, Constellations & Click Ripples) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* 5. Main Login Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eedfc8]/10 border border-[#eedfc8]/25 text-[#eedfc8] text-xs font-bold tracking-wide backdrop-blur-md shadow-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Wedding Logistics Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-[#eedfc8]/80 font-medium">
            Sign in to access your guest & travel desk
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 ring-1 ring-emerald-950/20 overflow-hidden transition-all duration-300 hover:shadow-emerald-900/20">
          {/* Clean Role Navigation */}
          <div className="grid grid-cols-3 border-b border-slate-200/90 bg-slate-50/90 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`py-3.5 px-2 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRole === "admin"
                  ? "bg-white text-slate-900 border-b-2 border-emerald-600 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("call_center")}
              className={`py-3.5 px-2 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRole === "call_center"
                  ? "bg-white text-slate-900 border-b-2 border-emerald-600 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Call Center</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("marriage_client")}
              className={`py-3.5 px-2 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRole === "marriage_client"
                  ? "bg-white text-slate-900 border-b-2 border-emerald-600 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Marriage View</span>
            </button>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              {/* Username / Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  {activeRole === "marriage_client"
                    ? "Marriage User ID / Username"
                    : "Username or Email"}
                </label>
                <div className="relative group">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="text"
                    name="login_identifier"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeRole === "marriage_client"
                        ? "Enter your marriage portal ID"
                        : activeRole === "call_center"
                        ? "Enter your call center email"
                        : "Enter your admin username or email"
                    }
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="login_password"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#5c1322] hover:bg-[#480e1b] active:scale-98 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50 mt-2 btn-interactive"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>
                      {activeRole === "marriage_client"
                        ? "View Marriage Details"
                        : "Sign In"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#eedfc8]" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#eedfc8]/60">
          Wedding Logistics & Guest Management Portal
        </p>
      </div>
    </div>
  );
}
