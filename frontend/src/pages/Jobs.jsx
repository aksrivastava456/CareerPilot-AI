import { useState } from "react";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import "./Home.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function parseJobMatch(markdown) {
  if (!markdown) return null;

  try {
    const pctMatch = markdown.match(/(?:Overall Match Percentage|Match Percentage|Score|Overall Match):\s*(\d+)/i) || markdown.match(/(\d+)%/);
    const score = pctMatch ? parseInt(pctMatch[1], 10) : null;

    if (score === null) return null;

    let reason = "";
    const reasonMatch = markdown.match(/Reason:\s*([\s\S]*?)(?=\n#|\nOverall|$)/i);
    if (reasonMatch) {
      reason = reasonMatch[1].trim();
    } else {
      const overallIndex = markdown.search(/# Overall Match/i);
      if (overallIndex !== -1) {
        const sub = markdown.slice(overallIndex);
        const nextHeading = sub.slice(1).search(/^#/m);
        const block = nextHeading !== -1 ? sub.slice(0, nextHeading + 1) : sub;
        reason = block
          .split("\n")
          .filter(l => !l.startsWith("#") && !l.toLowerCase().includes("percentage") && l.trim())
          .join(" ")
          .trim();
      }
    }

    return {
      score,
      reason: reason || "We evaluated your active profile experience and tech keywords against this target role description to generate matching indicators."
    };
  } catch (e) {
    return null;
  }
}

export default function JobsPanel({ 
  token, 
  jobDescription, 
  setJobDescription, 
  jobMatch, 
  setJobMatch, 
  interviewQuestions, 
  setInterviewQuestions, 
  onUploadRedirect, 
  onAskCopilot, 
  onLogout 
}) {
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  async function handleMatchSubmit(event) {
    event.preventDefault();

    if (!jobDescription.trim()) {
      toast.error("Please paste a job description first.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/jobs/match`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ job_description: jobDescription })
      });

      const data = await response.json();

      if (response.ok) {
        const matchResult = data.job_match?.job_match || data.job_match || "";
        setJobMatch(matchResult);
        // Clear old questions when matching a new job
        setInterviewQuestions("");
      } else {
        if (response.status === 401) {
          if (onLogout) onLogout();
          return;
        }
        if (response.status === 429) {
          toast.error(data.detail || "Rate limit exceeded. Please try again later.");
        } else if (response.status === 404) {
          toast.warn("Please upload a resume first.");
          if (onUploadRedirect) onUploadRedirect();
        } else {
          toast.error(data.detail || "Failed to compare resume.");
        }
      }
    } catch (err) {
      toast.error("Network error. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateQuestions() {
    if (!jobDescription.trim()) return;

    try {
      setLoadingQuestions(true);
      const response = await fetch(`${API_URL}/interview/questions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ job_description: jobDescription })
      });

      const data = await response.json();

      if (response.ok) {
        const questionsResult = data.interview_questions?.interview_questions || data.interview_questions || "";
        setInterviewQuestions(questionsResult);
        toast.success("Practice interview questions generated successfully!");
      } else {
        if (response.status === 401) {
          if (onLogout) onLogout();
          return;
        }
        toast.error(data.detail || "Failed to generate interview questions.");
      }
    } catch (err) {
      toast.error("Network error. Make sure the backend server is running.");
    } finally {
      setLoadingQuestions(false);
    }
  }

  function handleReset() {
    setJobDescription("");
    setJobMatch("");
    setInterviewQuestions("");
  }

  return (
    <section className="home-panel">
      <div className="panel-header">
        <div>
          <p className="section-tag">Job Match</p>
          <h2 style={{ fontSize: "1.8rem", margin: "6px 0 0" }}>Compare Against Roles</h2>
        </div>
      </div>

      <div className="panel-content">
        {loading ? (
          <div style={{ padding: "20px", background: "#ffffff", border: "1px solid var(--border)", borderRadius: "6px", marginBottom: "20px" }}>
            <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "0.92rem", fontWeight: 500 }}>Matching resume with job description...</p>
            <div className="skeleton-loader">
              <div className="skeleton-line title"></div>
              <div className="skeleton-line body-long"></div>
              <div className="skeleton-line body-medium"></div>
              <div className="skeleton-line body-short"></div>
              <div style={{ height: "12px" }}></div>
              <div className="skeleton-line body-long"></div>
              <div className="skeleton-line body-medium"></div>
            </div>
          </div>
        ) : jobMatch ? (
          <div>
            {(() => {
              const parsedMatch = parseJobMatch(jobMatch);
              if (parsedMatch) {
                const radius = 60;
                const strokeWidth = 8;
                const normalizedRadius = radius - strokeWidth * 2;
                const circumference = normalizedRadius * 2 * Math.PI;
                const strokeDashoffset = circumference - (parsedMatch.score / 100) * circumference;

                const getScoreColor = (s) => s >= 85 ? "#22c55e" : s >= 70 ? "#6366f1" : s >= 50 ? "#f97316" : "#ef4444";
                const getScoreTier = (s) => s >= 85 ? "Excellent" : s >= 70 ? "Good" : s >= 50 ? "Moderate" : "Weak";
                const getScoreBadgeStyles = (s) => {
                  if (s >= 85) return { bg: "#dcfce7", text: "#166534" };
                  if (s >= 70) return { bg: "#e0e7ff", text: "#3730a3" };
                  if (s >= 50) return { bg: "#ffedd5", text: "#9a3412" };
                  return { bg: "#ffe4e6", text: "#991b1b" };
                };
                const badge = getScoreBadgeStyles(parsedMatch.score);

                return (
                  <div style={{ display: "grid", gap: "20px" }}>
                    {/* Top Score Summary Board */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "24px",
                      padding: "20px",
                      background: "#ffffff",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                      flexWrap: "nowrap",
                      textAlign: "left"
                    }}>
                      <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg height="120" width="120" style={{ transform: "rotate(-90deg)" }}>
                          <circle
                            stroke="#f1f5f9"
                            fill="transparent"
                            strokeWidth={strokeWidth}
                            r={normalizedRadius}
                            cx="60"
                            cy="60"
                          />
                          <circle
                            stroke={getScoreColor(parsedMatch.score)}
                            fill="transparent"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference + ' ' + circumference}
                            style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease-in-out" }}
                            r={normalizedRadius}
                            cx="60"
                            cy="60"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span style={{ position: "absolute", fontSize: "1.6rem", fontWeight: 800, color: "var(--text)" }}>
                          {parsedMatch.score}%
                        </span>
                      </div>
                      
                      <div style={{ flex: 1, display: "grid", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>
                            Compatibility Tier
                          </span>
                          <span style={{
                            background: badge.bg,
                            color: badge.text,
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            textTransform: "uppercase"
                          }}>
                            {getScoreTier(parsedMatch.score)}
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "var(--text)" }}>
                          Resume-Job Compatibility Report
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)", lineHeight: "1.5" }}>
                          {parsedMatch.reason}
                        </p>
                      </div>
                    </div>

                    {/* Standard Markdown Report render under it */}
                    <div style={{ textAlign: "left", padding: "20px", background: "#ffffff", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)" }}>
                      <div className="markdown-content" style={{ textAlign: "left", lineHeight: "1.6" }}>
                        <ReactMarkdown>{jobMatch}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              }

              // Fallback to raw markdown if parsing fails
              return (
                <div style={{ textAlign: "left", padding: "20px", background: "#ffffff", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", marginBottom: "20px" }}>
                  <div className="panel-header" style={{ marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                    <div>
                      <p className="section-tag" style={{ color: "var(--primary)" }}>Report</p>
                      <h3 style={{ fontSize: "1.2rem", margin: "4px 0 0", fontWeight: 700 }}>Job Compatibility Report</h3>
                    </div>
                  </div>
                  <div className="markdown-content" style={{ textAlign: "left", lineHeight: "1.6" }}>
                    <ReactMarkdown>{jobMatch}</ReactMarkdown>
                  </div>
                </div>
              );
            })()}

            {/* Generated Interview Questions Section */}
            {loadingQuestions ? (
              <div style={{ padding: "20px", background: "#ffffff", border: "1px solid var(--border)", borderRadius: "12px", marginBottom: "20px", marginTop: "32px" }}>
                <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "0.92rem", fontWeight: 500 }}>Generating practice interview questions...</p>
                <div className="skeleton-loader">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line body-long"></div>
                  <div className="skeleton-line body-medium"></div>
                  <div className="skeleton-line body-short"></div>
                </div>
              </div>
            ) : interviewQuestions ? (
              <div
                style={{
                  textAlign: "left",
                  padding: "24px",
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "var(--text)",
                  marginBottom: "20px",
                  marginTop: "32px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "20px" }}>
                  <p className="section-tag" style={{ color: "var(--primary)", fontWeight: 700, margin: 0 }}>PRACTICE PREPARATION</p>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "6px 0 0", color: "var(--text)" }}>
                    Tailored Practice Interview Questions
                  </h3>
                  <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: "0.88rem" }}>
                    Custom interview Q&As generated specifically for your profile against this target role.
                  </p>
                </div>
                <div className="markdown-content" style={{ textAlign: "left", lineHeight: "1.6" }}>
                  <ReactMarkdown>{interviewQuestions}</ReactMarkdown>
                </div>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "24px" }}>
              <button className="job-ghost-btn" onClick={handleReset}>
                Compare Another Role
              </button>

              {!interviewQuestions && !loadingQuestions && (
                <button 
                  className="job-secondary-btn" 
                  onClick={handleGenerateQuestions}
                >
                  Generate Practice Questions
                </button>
              )}

              {onAskCopilot && (
                <button
                  className="job-primary-btn"
                  onClick={() => onAskCopilot(`Based on the job matcher results for this description: "${jobDescription.slice(0, 300)}...", how can I improve my resume's target experience and keywords to raise my matching score?`)}
                >
                  Discuss with AI Copilot
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleMatchSubmit}>
            <p style={{ color: "var(--muted)", marginBottom: "16px", lineHeight: "1.5" }}>
              Paste the description of the job you are targeting below. We will run it against your resume highlights, detect key strengths, extract missing keywords, and evaluate your matching score.
            </p>
            <textarea
              className="job-textarea"
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="job-primary-btn" disabled={loading}>
              Compare Resume
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
