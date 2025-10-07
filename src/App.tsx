import { useState, useEffect, useRef } from "react";
import "./App.css";
import catGif from "./assets/cat-meme-laughing-gif.gif";

interface CaptchaResult {
  success: boolean;
  userTime?: number;
  aiTime?: number;
  aiSteps?: string[];
}

interface LogEntry {
  step: string;
  timestamp: number;
}

function App() {
  const [captchaImage, setCaptchaImage] = useState<string>("");
  const [userGuess, setUserGuess] = useState("");
  const [isLoading, setCaptchaLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [result, setResult] = useState<CaptchaResult | null>(null);
  const [aiLogs, setAiLogs] = useState<LogEntry[]>([]);
  const [isAiSolving, setIsAiSolving] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [userHasSubmitted, setUserHasSubmitted] = useState(false);
  const [aiTimer, setAiTimer] = useState(0);
  const [isAiTimerRunning, setIsAiTimerRunning] = useState(false);
  const [captchaText, setCaptchaText] = useState("");
  const [captchaFilename, setCaptchaFilename] = useState("");

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const aiTimerRef = useRef<number | null>(null);
  const aiStartTimeRef = useRef<number>(0);

  const backendUrl = "https://aziac-csaf-captcha.hf.space";

  // Updates displayed time every 100ms while timer is running
  useEffect(() => {
    if (isTimerRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimer(Date.now() - startTimeRef.current!);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Updates displayed time every 100ms while AI timer is running
  useEffect(() => {
    if (isAiTimerRunning) {
      aiTimerRef.current = setInterval(() => {
        setAiTimer(Date.now() - aiStartTimeRef.current);
      }, 100);
    } else {
      if (aiTimerRef.current) {
        clearInterval(aiTimerRef.current);
      }
    }

    return () => {
      if (aiTimerRef.current) {
        clearInterval(aiTimerRef.current);
      }
    };
  }, [isAiTimerRunning]);

  // Mock CAPTCHA API
  const getCaptcha = async () => {
    setCaptchaLoading(true);
    setResult(null);
    setAiLogs([]);
    setTimer(0);
    setAiTimer(0);
    setUserHasSubmitted(false);

    try {
      const response = await fetch(`${backendUrl}/get_captcha`);

      // Handle cases where the server responds with an error (e.g., 404, 500)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const filename = data.filename;

      setCaptchaFilename(filename);
      const correctText = filename.split(".")[0];
      setCaptchaText(correctText);

      const imageUrl = `${backendUrl}/static/images/${filename}`;

      setCaptchaImage(imageUrl);
      setShowCaptcha(true);
    } catch (error) {
      console.error("Failed to fetch captcha:", error);
    } finally {
      setCaptchaLoading(false);
      setIsTimerRunning(true);
    }
  };

  // user submission
  const submitGuess = async () => {
    setIsTimerRunning(false);
    const userTime = timer;
    setUserHasSubmitted(true);

    // validation
    const success = userGuess.toLowerCase() === captchaText.toLowerCase();

    setResult({
      success,
      userTime,
    });
  };

  // Mock AI solving with streaming logs (To be changed later with actual Model Response!)
  const solveWithAI = async () => {
    setIsAiSolving(true);
    setAiLogs([]);
    setIsAiTimerRunning(true);

    const aiStartTime = Date.now();
    aiStartTimeRef.current = aiStartTime;

    const addLog = (step: string) => {
      setAiLogs((prev) => [
        ...prev,
        { step, timestamp: Date.now() - aiStartTime },
      ]);
    };

    try {
      addLog("Sending image to AI for analysis...");

      const response = await fetch(`${backendUrl}/solve_captcha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: captchaFilename }),
      });

      if (!response.ok) {
        throw new Error(`AI server error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiPrediction = data.prediction;

      addLog(`AI prediction received: "${aiPrediction}"`);

      setResult((prev) => ({
        ...prev!,
        aiPrediction: aiPrediction,
      }));
    } catch (error) {
      console.error("AI failed to solve:", error);
      addLog("An error occurred during AI solving.");
    } finally {
      setIsAiTimerRunning(false);
      const finalAiTime = Date.now() - aiStartTime;
      setResult((prev) => ({
        ...prev!,
        aiTime: finalAiTime,
      }));
      setIsAiSolving(false);
    }
  };

  const resetDemo = () => {
    setCaptchaImage("");
    setUserGuess("");
    setShowCaptcha(false);
    setResult(null);
    setAiLogs([]);
    setTimer(0);
    setAiTimer(0);
    setIsTimerRunning(false);
    setIsAiTimerRunning(false);
    setIsAiSolving(false);
    setUserHasSubmitted(false);
  };

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1) + "s";
  };

  return (
    <div className="app">
      <div className="container">
        <h1>CAPTCHA Demo</h1>

        {!showCaptcha && !isLoading && (
          <div className="landing">
            <p>Test your skills against AI in solving CAPTCHAs!</p>
            <button onClick={getCaptcha} className="primary-button">
              Get CAPTCHA
            </button>
          </div>
        )}

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading CAPTCHA...</p>
          </div>
        )}

        {showCaptcha && (
          <div className="captcha-section">
            <div className="captcha-container">
              <img src={captchaImage} alt="CAPTCHA" className="captcha-image" />

              <div className="timer">Timer: {formatTime(timer)}</div>
            </div>

            {!userHasSubmitted && (
              <div className="input-section">
                <input
                  type="text"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && userGuess.trim()) {
                      submitGuess();
                    }
                  }}
                  placeholder="Enter CAPTCHA text"
                  className="captcha-input"
                />
                <div className="button-group">
                  <button
                    onClick={submitGuess}
                    disabled={!userGuess.trim()}
                    className="submit-button"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {userHasSubmitted && !result?.aiTime && (
              <div className="ai-section">
                <p>Great! Now let's see how the AI performs:</p>
                <button
                  onClick={solveWithAI}
                  disabled={isAiSolving}
                  className="ai-button"
                >
                  {isAiSolving ? "AI Solving..." : "Solve with AI"}
                </button>
                {isAiTimerRunning && (
                  <div className="ai-timer">
                    AI Timer: {formatTime(aiTimer)}
                  </div>
                )}
              </div>
            )}

            {aiLogs.length > 0 && (
              <div className="ai-logs">
                <h3>AI Solving Process</h3>
                <div className="log-container">
                  {aiLogs.map((log, index) => (
                    <div key={index} className="log-entry">
                      <span className="log-time">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className="log-step">{log.step}</span>
                    </div>
                  ))}
                  {isAiSolving && (
                    <div className="log-entry active">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && (
              <div className="results">
                <h3>Results</h3>
                <div className="result-grid">
                  <div className="result-card">
                    <h4>Your Result</h4>
                    <div className="human-result">
                      {result.success ? "✓ Correct" : "✗ Incorrect"}
                    </div>
                    {result.userTime && (
                      <div className="time">
                        Time: {formatTime(result.userTime)}
                      </div>
                    )}
                  </div>

                  {result.aiTime && (
                    <div className="result-card">
                      <h4>AI Result</h4>
                      <div className="status success">✓ Solved</div>
                      <div className="time">
                        Time: {formatTime(result.aiTime)}
                      </div>
                    </div>
                  )}
                </div>

                {result.aiTime && (
                  <div className="result-gif">
                    <img
                      src={catGif}
                      alt="Celebration"
                      className="celebration-gif"
                    />
                  </div>
                )}

                <button onClick={resetDemo} className="reset-button">
                  Try Another CAPTCHA
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
