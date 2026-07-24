import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getValidToken } from "../utils/auth.js";
import "./Home.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";


import JobsPanel from "./Jobs.jsx";
import ChatPanel from "./Chat.jsx";

// ==================== DASHBOARD PANEL ====================
function DashboardPanel({ userProfile, userEmail, resumeStatus, setActiveTab, setAutoTriggerAction }) {
  return (
    <section className="home-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", justifyContent: "flex-start", height: "fit-content", flex: "0 1 auto" }}>
      {/* Welcome Section */}
      <div className="welcome-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
        <p className="section-tag">Workspace Overview</p>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "6px 0 4px", letterSpacing: "-0.5px" }}>
          Welcome back, {userProfile?.name || userEmail?.split("@")[0] || "Pilot"}!
        </h2>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>
          Track and optimize your professional trajectory. Chat with your resume data, compare match scores for target roles, or inspect ATS compliance from one unified dashboard.
        </p>
      </div>

      {/* Resume Status Card */}
      <div className="dashboard-status-card" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px",
        background: "#ffffff",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        gap: "16px",
        flexWrap: "wrap",
        boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "grid", gap: "6px", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>
              Active Resume Status
            </span>
            {resumeStatus.uploaded ? (
              <span className="badge-active" style={{ background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                ACTIVE
              </span>
            ) : (
              <span className="badge-inactive" style={{ background: "#ffe4e6", color: "#991b1b", padding: "3px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                EMPTY
              </span>
            )}
          </div>
          <h3 style={{ margin: "4px 0 0", fontSize: "1.2rem", fontWeight: 700, color: "var(--text)" }}>
            {resumeStatus.uploaded ? resumeStatus.filename : "No active resume loaded"}
          </h3>
        </div>
        <button 
          className="job-secondary-btn" 
          style={{ padding: "10px 18px", fontSize: "0.85rem" }} 
          onClick={() => setActiveTab("resume")}
        >
          {resumeStatus.uploaded ? "Swap Resume" : "Upload Resume"}
        </button>
      </div>
    </section>
  );
}

// ==================== PROFILE PANEL ====================
function ProfilePanel({ userProfile, userEmail, handleLogout }) {
  return (
    <section className="home-panel" style={{ maxWidth: "680px", width: "100%", margin: "40px auto", alignSelf: "center", flex: "0 1 auto" }}>
      <div className="panel-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
        <div>
          <p className="section-tag">Account</p>
          <h2 style={{ fontSize: "1.8rem", margin: "6px 0 0" }}>User Profile</h2>
        </div>
      </div>
      
      <div className="panel-content" style={{ display: "grid", gap: "20px", textAlign: "left", marginTop: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div 
            style={{ 
              width: "60px", 
              height: "60px", 
              borderRadius: "50%", 
              background: "var(--primary)", 
              color: "#ffffff", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: "1.6rem", 
              fontWeight: 700 
            }}
          >
            {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : "U")}
          </div>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "1.15rem", fontWeight: 700 }}>{userProfile?.name || "CareerPilot Member"}</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>Active Session</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Registered Email</p>
            <p style={{ margin: 0, fontWeight: 500, color: "var(--text)", fontSize: "0.95rem" }}>{userProfile?.email || userEmail}</p>
          </div>
        </div>

        <button 
          className="logout-btn" 
          style={{ width: "100%", padding: "12px", minHeight: "46px", marginTop: "10px" }} 
          onClick={handleLogout}
        >
          Logout from Account
        </button>
      </div>
    </section>
  );
}

// ==================== MAIN HOME COMPONENT ====================
export default function Home() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getValidToken());
  const userEmail = token ? localStorage.getItem("user_email") : null;

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [prefilledChatQuery, setPrefilledChatQuery] = useState("");
  const [autoTriggerAction, setAutoTriggerAction] = useState("");
  
  // Hoisted States to persist data on unmount (tab changes)
  const [chatHistory, setChatHistory] = useState([]);
  const [resumeStatus, setResumeStatus] = useState({ uploaded: false, filename: "" });
  const [jobDescription, setJobDescription] = useState("");
  const [jobMatch, setJobMatch] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState("");

  useEffect(() => {
    if (!token) return;

    async function fetchProfile() {
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        } else if (response.status === 401) {
          handleSessionExpired();
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    }

    async function fetchResumeStatus() {
      try {
        const response = await fetch(`${API_URL}/resume/status`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setResumeStatus(data);
        } else if (response.status === 401) {
          handleSessionExpired();
        }
      } catch (err) {
        console.error("Failed to fetch resume status:", err);
      }
    }

    async function fetchChatHistory() {
      try {
        const response = await fetch(`${API_URL}/chat/history`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setChatHistory(data.history || []);
        } else if (response.status === 401) {
          handleSessionExpired();
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    }

    fetchProfile();
    fetchResumeStatus();
    fetchChatHistory();
  }, [token]);

  function handleSessionExpired() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    setToken(null);
    toast.error("Your session has expired. Please log in again.");
    navigate("/login");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    setToken(null);
    setShowDropdown(false);
    navigate("/login");
  }

  function handleFileChange(event) {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  }

  function handleGuestFeatureClick() {
    toast.warn("Please log in to access this feature.");
    navigate("/login");
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();

    if (!token) {
      toast.warn("Please log in to submit your resume.");
      navigate("/login");
      return;
    }

    if (!selectedFile) {
      toast.error("Please choose a file to upload.");
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/resume/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Resume uploaded and processed successfully.");
        // Save upload timestamp locally
        localStorage.setItem("resume_uploaded_at", new Date().toLocaleString());
        setResumeStatus({ uploaded: true, filename: selectedFile.name });
        setSelectedFile(null);
        setActiveTab("chat");
      } else {
        toast.error(data.detail || data.error || "Upload failed. Please try again.");
      }
    } catch (err) {
      toast.error("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  }

  // ==================== RENDERING FOR LOGGED OUT USERS ====================
  if (!token) {
    const chipStyle = {
      display: "grid",
      gap: "8px",
      alignContent: "start",
      height: "auto",
      padding: "16px",
      flex: "0 1 280px",
      width: "280px"
    };

    return (
      <main className="home-page" style={{ background: "radial-gradient(circle at top right, rgba(99, 102, 241, 0.06) 0%, #f8fafc 80%)" }}>
        <div className="home-container" style={{ maxWidth: "960px", width: "100%", padding: "0 20px 80px" }}>
          <header className="topbar" style={{ padding: "20px 0", marginBottom: "40px" }}>
            <p className="brand-name" style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.5px" }}>CareerPilot AI</p>
            <div className="nav-actions">
              <button className="job-ghost-btn" style={{ padding: "8px 16px" }} onClick={() => navigate("/login")}>
                Login
              </button>
              <button className="job-primary-btn" style={{ padding: "8px 16px" }} onClick={() => navigate("/register")}>
                Register
              </button>
            </div>
          </header>

          <section className="home-hero" style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            boxShadow: "0 10px 30px -10px rgba(99, 102, 241, 0.05)",
            marginBottom: "32px",
            display: "grid",
            gap: "16px",
            justifyItems: "center"
          }}>
            <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, margin: 0, letterSpacing: "-1px", lineHeight: 1.1, color: "var(--text)" }}>
              Navigate your next <span style={{ color: "var(--primary)", background: "linear-gradient(to right, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>career move</span> with AI
            </h1>
            <p style={{ fontSize: "1.05rem", color: "var(--muted)", maxWidth: "600px", margin: 0, lineHeight: "1.6" }}>
              Search work history, evaluate job compatibility, and prepare for interviews.
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button className="job-primary-btn" onClick={() => navigate("/register")} style={{ padding: "12px 24px" }}>
                Get Started Free
              </button>
              <button className="job-ghost-btn" onClick={() => navigate("/login")} style={{ padding: "12px 24px" }}>
                Sign In
              </button>
            </div>
          </section>

          {/* Centered chips grid matching 3 on top row, 2 below row */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", alignItems: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", width: "100%" }}>
              <article className="suggestion-chip" onClick={handleGuestFeatureClick} style={chipStyle}>
                <strong style={{ fontSize: "0.95rem", color: "var(--text)", fontWeight: 700 }}>AI Copilot Chat</strong>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: "1.4" }}>
                  Query specific project timelines, frameworks, or experience details on your resume.
                </p>
              </article>

              <article className="suggestion-chip" onClick={handleGuestFeatureClick} style={chipStyle}>
                <strong style={{ fontSize: "0.95rem", color: "var(--text)", fontWeight: 700 }}>Job Matching</strong>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: "1.4" }}>
                  Compare your resume against target descriptions to calculate fit scores.
                </p>
              </article>

              <article className="suggestion-chip" onClick={handleGuestFeatureClick} style={chipStyle}>
                <strong style={{ fontSize: "0.95rem", color: "var(--text)", fontWeight: 700 }}>ATS Analysis</strong>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: "1.4" }}>
                  Check formatting elements, layout compliance, and score keywords density.
                </p>
              </article>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", width: "100%" }}>
              <article className="suggestion-chip" onClick={handleGuestFeatureClick} style={chipStyle}>
                <strong style={{ fontSize: "0.95rem", color: "var(--text)", fontWeight: 700 }}>Resume Summary</strong>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: "1.4" }}>
                  Get a quick highlights outline summary of your primary professional profile.
                </p>
              </article>

              <article className="suggestion-chip" onClick={handleGuestFeatureClick} style={chipStyle}>
                <strong style={{ fontSize: "0.95rem", color: "var(--text)", fontWeight: 700 }}>Interview Prep</strong>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: "1.4" }}>
                  Practice technical questions and prep guidelines customized for target roles.
                </p>
              </article>
            </div>
          </div>

        </div>
      </main>
    );
  }

  // ==================== RENDERING FOR LOGGED IN WORKSPACE ====================
  return (
    <main className="dashboard-layout">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <p className="sidebar-brand">CareerPilot AI</p>
          <nav className="sidebar-menu">
            <button
              className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`menu-item ${activeTab === "resume" ? "active" : ""}`}
              onClick={() => setActiveTab("resume")}
            >
              Resume
            </button>
            <button
              className={`menu-item ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              AI Copilot
            </button>
            <button
              className={`menu-item ${activeTab === "jobs" ? "active" : ""}`}
              onClick={() => setActiveTab("jobs")}
            >
              Job Match
            </button>
            <button
              className={`menu-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" style={{ width: "100%" }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* RIGHT VIEWPORT CONTENT */}
      <div className="dashboard-content">
        <div className="dashboard-viewport">
          {activeTab === "dashboard" && (
            <DashboardPanel
              userProfile={userProfile}
              userEmail={userEmail}
              resumeStatus={resumeStatus}
              setActiveTab={setActiveTab}
              setAutoTriggerAction={setAutoTriggerAction}
            />
          )}

          {activeTab === "resume" && (
            <section className="home-panel">
              <div className="panel-header">
                <div>
                  <p className="section-tag">Resume</p>
                  <h2>Attach or Swap Resume</h2>
                </div>
              </div>
              
              <div className="panel-content">
                {resumeStatus.uploaded ? (
                  <div style={{ textAlign: "left", display: "grid", gap: "16px" }}>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Active Resume</p>
                      <p style={{ margin: 0, fontWeight: 550, color: "var(--text)", fontSize: "1.1rem" }}>{resumeStatus.filename}</p>
                    </div>
                    
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                      <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: "0.9rem" }}>Would you like to replace your resume with a new PDF?</p>
                      <form onSubmit={handleUploadSubmit} className="upload-controls" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        <label className="upload-btn" htmlFor="resume-upload" style={{ margin: 0 }}>
                          {selectedFile ? "Change File" : "Choose New File"}
                        </label>
                        <input
                          id="resume-upload"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                        {selectedFile && <span style={{ fontSize: "0.9rem", color: "var(--text)" }}>{selectedFile.name}</span>}
                        <button type="submit" className="submit-btn" style={{ minHeight: "auto", height: "46px" }} disabled={uploading || !selectedFile}>
                          {uploading ? "Replacing..." : "Replace Resume"}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUploadSubmit} className="upload-area">
                    <p>
                      {selectedFile
                        ? `Selected file: ${selectedFile.name}`
                        : "Choose a PDF file to process your RAG data."}
                    </p>
                    <div className="upload-controls">
                      <label className="upload-btn" htmlFor="resume-upload">
                        Choose file
                      </label>
                      <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                      <button type="submit" className="submit-btn" disabled={uploading}>
                        {uploading ? "Uploading..." : "Submit Resume"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )}

          {activeTab === "jobs" && (
            <JobsPanel
              token={token}
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              jobMatch={jobMatch}
              setJobMatch={setJobMatch}
              interviewQuestions={interviewQuestions}
              setInterviewQuestions={setInterviewQuestions}
              onUploadRedirect={() => setActiveTab("resume")}
              onAskCopilot={(query) => {
                setPrefilledChatQuery(query);
                setActiveTab("chat");
              }}
              onLogout={handleSessionExpired}
            />
          )}

          {activeTab === "chat" && (
            <ChatPanel
              token={token}
              history={chatHistory}
              setHistory={setChatHistory}
              onUploadRedirect={() => setActiveTab("resume")}
              initialQuery={prefilledChatQuery}
              onClearInitialQuery={() => setPrefilledChatQuery("")}
              onLogout={handleSessionExpired}
              autoTriggerAction={autoTriggerAction}
              onClearAutoTriggerAction={() => setAutoTriggerAction("")}
            />
          )}

          {activeTab === "profile" && (
            <ProfilePanel
              userProfile={userProfile}
              userEmail={userEmail}
              handleLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </main>
  );
}
