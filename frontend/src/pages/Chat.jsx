import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import "./Home.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function parseATS(markdown) {
  if (!markdown) return null;
  if (!markdown.toLowerCase().includes("ats score") && !markdown.includes("/100")) return null;

  try {
    const scoreMatch = markdown.match(/(?:ATS Score|Score):\s*(\d+)\/100/i) || markdown.match(/(\d+)\/100/);
    if (!scoreMatch) return null;
    const score = parseInt(scoreMatch[1], 10);
    return { score };
  } catch (e) {
    return null;
  }
}

function ATSVisualDashboard({ content }) {
  const parsed = parseATS(content);
  if (!parsed) {
    return (
      <div className="markdown-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  const radius = 50;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (parsed.score / 100) * circumference;

  const getScoreColor = (s) => s >= 85 ? "#22c55e" : s >= 70 ? "#6366f1" : s >= 50 ? "#f97316" : "#ef4444";
  const getScoreTier = (s) => s >= 85 ? "Excellent" : s >= 70 ? "Good" : s >= 50 ? "Needs Work" : "Weak";
  const getScoreBadgeStyles = (s) => {
    if (s >= 85) return { bg: "#dcfce7", text: "#166534" };
    if (s >= 70) return { bg: "#e0e7ff", text: "#3730a3" };
    if (s >= 50) return { bg: "#ffedd5", text: "#9a3412" };
    return { bg: "#ffe4e6", text: "#991b1b" };
  };
  const badge = getScoreBadgeStyles(parsed.score);

  return (
    <div style={{ display: "grid", gap: "20px", width: "100%", textAlign: "left" }}>
      {/* Top Banner Board */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "24px",
        padding: "20px",
        background: "#ffffff",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        flexWrap: "nowrap",
        boxShadow: "0 4px 12px rgba(0,0,0,0.01)"
      }}>
        <div style={{ position: "relative", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg height="100" width="100" style={{ transform: "rotate(-90deg)" }}>
            <circle
              stroke="#f1f5f9"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx="50"
              cy="50"
            />
            <circle
              stroke={getScoreColor(parsed.score)}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease-in-out" }}
              r={normalizedRadius}
              cx="50"
              cy="50"
              strokeLinecap="round"
            />
          </svg>
          <span style={{ position: "absolute", fontSize: "1.3rem", fontWeight: 800, color: "var(--text)" }}>
            {parsed.score}
          </span>
        </div>
        
        <div style={{ flex: 1, display: "grid", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>
              ATS Optimization Score
            </span>
            <span style={{
              background: badge.bg,
              color: badge.text,
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase"
            }}>
              {getScoreTier(parsed.score)}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>
            ATS Compliance Audit Report
          </h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)", lineHeight: "1.5" }}>
            This score evaluates structural design, keyword density, and overall text parsing capability.
          </p>
        </div>
      </div>

      {/* Render raw response content below the visual header */}
      <div className="markdown-content" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

export default function ChatPanel({ 
  token, 
  history, 
  setHistory, 
  onUploadRedirect, 
  initialQuery, 
  onClearInitialQuery, 
  onLogout,
  autoTriggerAction,
  onClearAutoTriggerAction
}) {
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  useEffect(() => {
    if (autoTriggerAction === "analyze") {
      handleDirectAction("analyze");
      if (onClearAutoTriggerAction) onClearAutoTriggerAction();
    }
  }, [autoTriggerAction]);

  const sendQuery = async (queryText) => {
    if (!queryText.trim()) return;

    setHistory((prev) => [...prev, { role: "user", content: queryText }]);

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: queryText })
      });

      const data = await response.json();

      if (response.ok) {
        const aiAnswer = typeof data.answer === "object" ? data.answer.response : data.answer;
        setHistory((prev) => [...prev, { role: "assistant", content: aiAnswer || "" }]);
      } else {
        if (response.status === 401) {
          if (onLogout) onLogout();
          return;
        }
        if (response.status === 429) {
          toast.error(data.detail || "Rate limit exceeded.");
        } else if (response.status === 404) {
          toast.warn("Please upload a resume first.");
          if (onUploadRedirect) onUploadRedirect();
        } else {
          toast.error(data.detail || "Failed to get response.");
        }
      }
    } catch (err) {
      toast.error("Network error. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAction = async (actionType) => {
    const queryText = actionType === "summarize" ? "Summarize my resume" : "Analyze ATS";
    
    // Add user query to history
    setHistory((prev) => [...prev, { role: "user", content: queryText }]);
    setLoading(true);

    try {
      const endpoint = actionType === "summarize" ? "summarize" : "analyze";
      const response = await fetch(`${API_URL}/resume/${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        const aiAnswer = actionType === "summarize" ? data.summary : data.analysis;
        setHistory((prev) => [...prev, { role: "assistant", content: aiAnswer || "" }]);
      } else {
        if (response.status === 401) {
          if (onLogout) onLogout();
          return;
        }
        if (response.status === 404) {
          toast.warn("Please upload a resume first.");
          if (onUploadRedirect) onUploadRedirect();
        } else {
          toast.error(data.detail || `Failed to perform ${actionType}.`);
        }
      }
    } catch (err) {
      toast.error("Network error. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      sendQuery(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery, onClearInitialQuery]);

  async function handleFormSubmit(event) {
    event.preventDefault();
    if (!userQuery.trim()) return;
    const q = userQuery;
    setUserQuery("");
    await sendQuery(q);
  }

  async function handleReset() {
    try {
      await fetch(`${API_URL}/chat/clear`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Failed to clear chat history on server:", err);
    }
    setUserQuery("");
    setHistory([]);
  }

  return (
    <section className="home-panel" style={{ marginTop: 0 }}>
      <div className="panel-header" style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
        <button 
          onClick={() => handleDirectAction("summarize")} 
          className="chat-action-btn" 
          disabled={loading}
        >
          Summarize Resume
        </button>
        <button 
          onClick={() => handleDirectAction("analyze")} 
          className="chat-action-btn" 
          disabled={loading}
        >
          Analyze ATS
        </button>
        {history.length > 0 && (
          <button 
            onClick={handleReset} 
            className="chat-clear-btn" 
            disabled={loading}
          >
            Clear History
          </button>
        )}
      </div>

      <div className="chat-container">
        <div className="chat-box">
          {history.length === 0 ? (
            <div className="chat-empty" style={{ padding: "60px 20px" }}>
              <p style={{ fontWeight: 700, fontSize: "1.3rem", margin: "0 0 10px", color: "var(--text)" }}>
                Chat with your Resume Copilot
              </p>
              <p style={{ margin: "0 0 24px", fontSize: "0.92rem", color: "var(--muted)", maxWidth: "480px", lineHeight: "1.6" }}>
                Ask questions about your projects, technologies, work history, or request recommendations. Use the quick-actions in the top bar to run full summaries and ATS reviews.
              </p>
              
              <div className="suggestion-chips-grid" style={{ maxWidth: "600px" }}>
                <button type="button" className="suggestion-chip" onClick={() => sendQuery("What are my strongest projects and what makes them stand out?")}>
                  <div className="chip-text">
                    <strong>Strongest Projects</strong>
                    <span>Evaluate project complexity, impact, and tech stacks</span>
                  </div>
                </button>
                
                <button type="button" className="suggestion-chip" onClick={() => sendQuery("List the primary technologies and tools mentioned in my resume, categorized by domain.")}>
                  <div className="chip-text">
                    <strong>Core Skillset</strong>
                    <span>Get a categorized breakdown of languages and frameworks</span>
                  </div>
                </button>

                <button type="button" className="suggestion-chip" onClick={() => sendQuery("Summarize my recent work experience and identify my key accomplishments.")}>
                  <div className="chip-text">
                    <strong>Experience Summary</strong>
                    <span>Review career timelines, responsibilities, and achievements</span>
                  </div>
                </button>

                <button type="button" className="suggestion-chip" onClick={() => sendQuery("Analyze my resume for any gaps or formatting weaknesses, and suggest improvements.")}>
                  <div className="chip-text">
                    <strong>Improvement Areas</strong>
                    <span>Identify missing keywords, layout gaps, or wording issues</span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            history.map((msg, index) => {
              const isATS = parseATS(msg.content);
              return (
                <div key={index} className={`chat-message ${msg.role}`}>
                  {msg.role === "assistant" ? (
                    isATS ? (
                      <ATSVisualDashboard content={msg.content} />
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )
                  ) : (
                    msg.content
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="chat-message assistant" style={{ width: "100%", maxWidth: "80%" }}>
              <div className="skeleton-loader">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line body-long"></div>
                <div className="skeleton-line body-medium"></div>
                <div className="skeleton-line body-short"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleFormSubmit} className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask a question about your resume..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="chat-send-btn" disabled={loading || !userQuery.trim()}>
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
