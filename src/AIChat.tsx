import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSpeechSynthesis } from "react-speech-kit";
import Sentiment from "sentiment";
import "./AIChat.css";

const AIChat: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [chatMessages, setChatMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const [mentorMessages, setMentorMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const { speak } = useSpeechSynthesis();
  const [isListening, setIsListening] = useState(false);
  const [alwaysOn, setAlwaysOn] = useState(false);
  const [mode, setMode] = useState<"chat" | "mentor">("chat");
  const [hoveredText, setHoveredText] = useState("");
  const recognitionRef = useRef<any>(null);
  const [fontSize, setFontSize] = useState(16);
  const [contrast, setContrast] = useState("default");
  const [simpleMode, setSimpleMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [shortcuts, setShortcuts] = useState<Record<string, string>>(() => {
    const savedShortcuts = localStorage.getItem("shortcuts");
    return savedShortcuts
      ? JSON.parse(savedShortcuts)
      : {
          sendMessage: "Enter",
          startListening: "Control+s",
          toggleSimpleMode: "Control+m",
          focusNext: "F1",
          selectItem: "F2",
        };
  });
  const sentiment = new Sentiment();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
  }, [shortcuts]);

  const handleShortcut = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key;
      const modifier = event.ctrlKey ? "Control+" : "";
      const shortcut = `${modifier}${key}`;

      Object.entries(shortcuts).forEach(([action, sc]) => {
        if (sc === shortcut) {
          event.preventDefault();
          switch (action) {
            case "sendMessage":
              sendMessage();
              break;
            case "startListening":
              startListening();
              break;
            case "toggleSimpleMode":
              setSimpleMode((prev) => !prev);
              break;
            case "focusNext":
              focusNextElement();
              break;
            case "selectItem":
              clickFocusedElement();
              break;
            default:
              break;
          }
        }
      });
    },
    [shortcuts]
  );

  const focusNextElement = () => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const activeElement = document.activeElement;
    const currentIndex = Array.from(focusableElements).indexOf(activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    (focusableElements[nextIndex] as HTMLElement).focus();
  };

  const clickFocusedElement = () => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.click();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, [handleShortcut]);

  useEffect(() => {
    if (mode === "chat") {
      setMessages(chatMessages);
    } else {
      setMessages(mentorMessages);
    }
  }, [mode, chatMessages, mentorMessages]);

  const handleUserInput = async () => {
    if (input.trim() === "") return;

    const userMessage = { role: "user", content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    if (mode === "chat") {
      setChatMessages(currentMessages);
    } else {
      setMentorMessages(currentMessages);
    }
    setInput("");

    const sentimentScore = sentiment.analyze(input).score;

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sentiment: sentimentScore,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from the server.");
      }

      const data = await response.json();
      const aiMessage = { role: "assistant", content: data.message };
      const updatedMessages = [...currentMessages, aiMessage];
      setMessages(updatedMessages);
      if (mode === "chat") {
        setChatMessages(updatedMessages);
      } else {
        setMentorMessages(updatedMessages);
      }
      speak({ text: data.message });
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        role: "assistant",
        content: "I'm having trouble connecting. Please check your internet connection and try again.",
      };
      const errorMessages = [...currentMessages, errorMessage];
      setMessages(errorMessages);
      if (mode === "chat") {
        setChatMessages(errorMessages);
      } else {
        setMentorMessages(errorMessages);
      }
    }
  };

  const handleCommand = useCallback((transcript: string) => {
    const text = transcript.toLowerCase();
    let response = "";

    if (text.includes("what's the time")) {
      response = `The time is ${new Date().toLocaleTimeString()}`;
    } else if (text.includes("what's the date")) {
      response = `Today's date is ${new Date().toLocaleDateString()}`;
    } else if (text.startsWith("search for")) {
      const query = text.replace("search for", "").trim();
      window.open(`https://google.com/search?q=${query}`, "_blank");
      response = `Searching for ${query}`;
    } else if (text.includes("open youtube")) {
      window.open("https://youtube.com", "_blank");
      response = "Opening YouTube";
    } else if (text.includes("open wikipedia")) {
      window.open("https://wikipedia.org", "_blank");
      response = "Opening Wikipedia";
    } else if (text.includes("open github")) {
      window.open("https://github.com", "_blank");
      response = "Opening GitHub";
    } else if (text.includes("tell me a joke")) {
      const jokes = [
        "Why don’t scientists trust atoms? Because they make up everything!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "Why don’t skeletons fight each other? They don’t have the guts.",
      ];
      response = jokes[Math.floor(Math.random() * jokes.length)];
    } else if (text.includes("open twitter")) {
      window.open("https://twitter.com", "_blank");
      response = "Opening Twitter";
    } else if (text.includes("open reddit")) {
      window.open("https://reddit.com", "_blank");
      response = "Opening Reddit";
    } else if (text.includes("open netflix")) {
      window.open("https://netflix.com", "_blank");
      response = "Opening Netflix";
    } else if (text.includes("open spotify")) {
      window.open("https://spotify.com", "_blank");
      response = "Opening Spotify";
    } else if (text.includes("what's the weather")) {
      window.open("https://www.google.com/search?q=weather", "_blank");
      response = "Here is the weather forecast";
    } else if (text.includes("get my location")) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank");
        });
        response = "Opening your location on Google Maps";
      } else {
        response = "Geolocation is not supported by this browser.";
      }
    } else if (text.includes("open amazon")) {
      window.open("https://amazon.com", "_blank");
      response = "Opening Amazon";
    } else if (text.includes("open linkedin")) {
      window.open("https://linkedin.com", "_blank");
      response = "Opening LinkedIn";
    } else if (text.includes("open discord")) {
      window.open("https://discord.com", "_blank");
      response = "Opening Discord";
    } else if (text.includes("open twitch")) {
      window.open("https://twitch.tv", "_blank");
      response = "Opening Twitch";
    } else if (text.includes("read the screen")) {
      const chatHistory = messages.map((msg) => `${msg.role}: ${msg.content}`).join(". ");
      response = chatHistory || "The chat is empty.";
    } else if (text.includes("increase font size")) {
      setFontSize((prev) => prev + 2);
      response = "Increased font size";
    } else if (text.includes("decrease font size")) {
      setFontSize((prev) => prev - 2);
      response = "Decreased font size";
    } else if (text.includes("high contrast mode")) {
      setContrast("high");
      response = "High contrast mode enabled";
    } else if (text.includes("default mode")) {
      setContrast("default");
      response = "Default mode enabled";
    } else if (text.includes("open be my eyes")) {
      window.open("https://www.bemyeyes.com", "_blank");
      response = "Opening Be My Eyes";
    } else if (text.includes("open aira")) {
      window.open("https://aira.io", "_blank");
      response = "Opening Aira";
    } else if (text.includes("send message")) {
      sendMessage();
      response = "Message sent.";
    } else if (text.includes("clear input")) {
      setInput("");
      response = "Input cleared.";
    } else if (text.includes("scroll up")) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop -= 100;
      }
      response = "Scrolled up.";
    } else if (text.includes("scroll down")) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop += 100;
      }
      response = "Scrolled down.";
    } else if (text.includes("hey zen")) {
      setAlwaysOn(true);
      response = "I'm listening.";
    } else if (text.includes("stop listening")) {
      setAlwaysOn(false);
      response = "No longer listening automatically.";
    } else if (text.includes("start mentor session")) {
      startMentorSession();
      response = "Mentor session started.";
    } else {
      return false; // Not a command
    }

    const newMessages = [
      ...messages,
      { role: "user", content: transcript },
      { role: "assistant", content: response },
    ];
    setMessages(newMessages);
    speak({ text: response });
    return true;
  }, [messages, speak, setFontSize, setContrast, setMessages, setAlwaysOn]);

  const startMentorSession = () => {
    const mentorMessage = {
      role: "assistant",
      content: "I'm here to help. As your AI mentor, I can assist with a variety of tasks. How can I support you today?",
    };
    const newMentorMessages = [...mentorMessages, mentorMessage];
    setMentorMessages(newMentorMessages);
    setMessages(newMentorMessages);
    speak({ text: mentorMessage.content });
  };

  const sendToOpenAI = useCallback(async (currentMessages: { role: string; content: string }[]) => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key not found. Make sure it's set in your .env file.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I can't respond right now. My circuits are a bit tangled. Please check the API key.",
        },
      ]);
      return;
    }

    const lastUserMessage = currentMessages[currentMessages.length - 1].content;
    const sentimentResult = sentiment.analyze(lastUserMessage);
    let textEmotion = "neutral";
    if (sentimentResult.score > 2) {
      textEmotion = "excited";
    } else if (sentimentResult.score < -2) {
      textEmotion = "sad";
    }

    const systemMessage = {
      role: "system",
      content:
        mode === "mentor"
          ? "You are an AI mentor for users with disabilities. Your tone should be encouraging, supportive, and empathetic. Focus on providing practical advice, resources, and motivation. Avoid overly complex language and be patient."
          : `You are a helpful assistant. The user seems to be ${textEmotion}. Please respond with empathy and appropriate emotion.`,
    };

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [systemMessage, ...currentMessages],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error.message);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Sorry, I’m stuck.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      speak({ text: reply }); // 🔊 AI speaks response
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `An error occurred: ${error}. Please try again later.`,
        },
      ]);
    }
  }, [speak, sentiment, setMessages, mode]);

  const handleMouseOver = (event: React.MouseEvent<HTMLElement>) => {
    const text = event.currentTarget.innerText;
    if (text && text !== hoveredText) {
      setHoveredText(text);
      speak({ text });
    }
  };

  const handleMouseOut = () => {
    setHoveredText("");
  };

  const downloadAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const synth = window.speechSynthesis;

    // Create a new Blob with the audio data
    const audioBlob = new Blob([text], { type: "audio/mpeg" });
    const url = URL.createObjectURL(audioBlob);

    // Create a temporary link to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = "response.mp3";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognitionInstance = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onstart = () => {
      setIsListening(true);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      if (alwaysOn) {
        recognitionRef.current.start();
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognitionInstance;
  }, [alwaysOn]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (!handleCommand(transcript)) {
          const newMessages = [...messages, { role: "user", content: transcript }];
          setMessages(newMessages);
          if (mode === "chat") {
            setChatMessages(newMessages);
          } else {
            setMentorMessages(newMessages);
          }
          sendToOpenAI(newMessages);
        }
      };
    }
  }, [messages, handleCommand, sendToOpenAI, mode]);

  const sendMessage = () => {
    if (input.trim()) {
      const newMessages = [...messages, { role: "user", content: input }];
      setMessages(newMessages);
      if (mode === "chat") {
        setChatMessages(newMessages);
      } else {
        setMentorMessages(newMessages);
      }
      sendToOpenAI(newMessages);
      setInput("");
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const containerStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    // Remove background and color styles from here as they are now in CSS
  };

  return (
    <div className="app-container" style={containerStyle}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="aurora-background">
        <div className="aurora-shape shape1"></div>
        <div className="aurora-shape shape2"></div>
        <div className="aurora-shape shape3"></div>
      </div>

      {showTutorial && (
        <div className="modal-glass">
          <div className="modal-content" role="dialog" aria-modal="true">
            <h2>Welcome to VoiceLens!</h2>
            <p>You can use voice commands to interact with the chat. Try saying things like:</p>
            <ul>
              <li>"What's the time?"</li>
              <li>"Search for cats"</li>
              <li>"Increase font size"</li>
            </ul>
            <button
              className="icon-button"
              onClick={() => setShowTutorial(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}

      <div className="glass-container">
        <header className="chat-header">
          <h1 onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>VoiceLens</h1>
          <div className="header-buttons">
            <div className="mode-toggle">
              <button
                className={`toggle-button ${mode === "chat" ? "active" : ""}`}
                onClick={() => setMode("chat")}
                aria-label="Switch to Chat Mode"
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
              >
                Chat
              </button>
              <button
                className={`toggle-button ${
                  mode === "mentor" ? "active" : ""
                }`}
                onClick={() => setMode("mentor")}
                aria-label="Switch to Mentor Mode"
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
              >
                Mentor
              </button>
            </div>
            <button className="icon-button" onClick={() => setSimpleMode(!simpleMode)} aria-label="Toggle simple mode" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </button>
            <button className="icon-button" onClick={() => setShowShortcuts(true)} aria-label="Edit shortcuts" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>
            </button>
          </div>
        </header>

        <main id="main-content">
          <div ref={chatContainerRef} className="chat-body" role="log" aria-live="assertive" aria-atomic="true">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-bubble ${msg.role === "user" ? "user" : "assistant"}`}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}>
                {msg.content}
                <button onClick={() => speak({ text: msg.content })} className="icon-button" aria-label="Listen to message" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                </button>
                {msg.role === "assistant" && (
                  <button onClick={() => downloadAudio(msg.content)} className="icon-button" aria-label="Download audio" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </main>

        <footer className="chat-footer">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            aria-label="Chat input"
            placeholder="Type a message or use voice commands..."
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
          />
          <button className="icon-button" onClick={sendMessage} aria-label="Send message" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
          <button
            className={`icon-button ${isListening ? "listening" : ""}`}
            onClick={startListening}
            disabled={isListening}
            aria-label={isListening ? "Stop listening" : "Start listening"}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
          </button>
        </footer>
      </div>

      {!simpleMode && (
        <div className="settings-sidebar">
          <h3 onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Settings</h3>
          <button className="icon-button" onClick={() => setContrast(contrast === "default" ? "high" : "default")} aria-label="Toggle high contrast mode" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          </button>
          <button className="icon-button" onClick={() => setFontSize((prev) => prev + 2)} aria-label="Increase font size" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button className="icon-button" onClick={() => setFontSize((prev) => prev - 2)} aria-label="Decrease font size" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button className="icon-button" onClick={() => setAnimationsEnabled(!animationsEnabled)} aria-label="Toggle animations" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 12h-11a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2zm-13 0V8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v4"></path></svg>
          </button>
        </div>
      )}

      {showShortcuts && (
        <div className="modal-glass">
          <div className="modal-content" role="dialog" aria-modal="true">
            <h2 onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Edit Shortcuts</h2>
            <div className="shortcuts-list">
              {Object.entries(shortcuts).map(([action, shortcut]) => (
                <div key={action} className="shortcut-item" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                  <span>{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <input
                    type="text"
                    className="shortcut-input"
                    value={shortcut}
                    onChange={(e) =>
                      setShortcuts((prev) => ({ ...prev, [action]: e.target.value }))
                    }
                    aria-label={`Shortcut for ${action.replace(/([A-Z])/g, ' $1').trim()}`}
                  />
                </div>
              ))}
            </div>
            <button
              className="icon-button"
              onClick={() => setShowShortcuts(false)}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;