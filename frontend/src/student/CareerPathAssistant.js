import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  User,
  Bot,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Code,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';

const QUICK_PROMPT_CHIPS = [
  {
    icon: Sparkles,
    label: 'Improve Match Score',
    prompt: 'How can I improve my match score for top campus roles based on my current skills and projects?'
  },
  {
    icon: Code,
    label: 'STAR Project Review',
    prompt: 'Review my projects and generate tailored STAR interview talking points for technical rounds.'
  },
  {
    icon: Briefcase,
    label: 'Interview Readiness',
    prompt: 'What technical interview questions should I expect for the jobs currently in my pipeline?'
  },
  {
    icon: Layers,
    label: 'Bridge Skill Gaps',
    prompt: 'What are the top 2 skill gaps between my profile and high-paying engineering internships, and how should I learn them?'
  }
];

export function CareerPathAssistant() {
  // Session Boundary: In-memory state only (F5 refresh starts clean slate)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to CareerPath AI! 👋

I am your personal, grounded technical career co-pilot. I have loaded your verified academic background, skills, projects, and active applications.

How can I help you accelerate your placement journey today?`,
      modelUsed: 'careerpath-grounded-engine'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [groundedContext, setGroundedContext] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Load grounded student context summary on mount
  useEffect(() => {
    async function loadGroundedSummary() {
      try {
        setError(null);
        const [meRes, appRes] = await Promise.all([
          api.get('/api/students/me').catch(err => {
            console.warn('Failed to load profile for assistant grounding:', err.message);
            return { success: false, data: null };
          }),
          api.get('/api/applications/my-applications').catch(err => {
            console.warn('Failed to load applications for assistant grounding:', err.message);
            return { success: false, data: [] };
          })
        ]);

        if (meRes && meRes.success && meRes.data) {
          setGroundedContext({
            name: meRes.data.full_name || 'Student',
            skillsCount: (meRes.data.skills || []).length,
            applicationsCount: (appRes?.data || []).length,
            completeness: meRes.data.completeness_score || meRes.data.profile_completeness || 0
          });
        } else if (!meRes?.success) {
          throw new Error('Could not load student profile grounding');
        }
      } catch (err) {
        console.error('Failed to load grounded context:', err);
        const status = err.status || err.data?.status;
        const msg = status === 401 ? 'Session expired. Please sign in.' : 'Could not load student profile grounding';
        setError(msg);
        showNotification(msg, 'error');
      }
    }
    loadGroundedSummary();
  }, []);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isSending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      // Build request payload from in-memory conversation history
      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/api/ai/chat', { messages: history });

      if (res && res.success && res.data) {
        const assistantReply = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.data.reply,
          modelUsed: res.data.modelUsed,
          isFallback: res.data.isFallback
        };
        setMessages(prev => [...prev, assistantReply]);
      } else {
        throw new Error(res?.message || res?.error || 'Failed to receive response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const status = err.status || err.data?.status;
      let userMsg = err.message || 'Assistant encountered an error';
      if (status === 401) {
        userMsg = 'Session expired. Please sign in again.';
      } else if (status === 429) {
        userMsg = 'AI rate limit reached. Please wait a minute.';
      } else if (status >= 500) {
        userMsg = 'AI advisor service is temporarily unavailable. Please try again shortly.';
      }
      setError(userMsg);
      showNotification(userMsg, 'error');
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${userMsg}`,
          isError: true
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Reset Session to Clean Slate
  const handleResetSession = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `### New Session Started 🔄\n\nYour session has been reset to a clean slate. Your verified profile context is active. What would you like to explore?`,
        modelUsed: 'careerpath-grounded-engine'
      }
    ]);
    setInputMessage('');
    showNotification('Conversation reset to clean slate');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4">
        {/* Grounding Error Alert */}
        {error && (
          <div data-testid="assistant-error-alert" className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center gap-2.5 text-rose-800 text-xs font-semibold">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Top Header & Grounding Badge */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  CareerPath AI Co-Pilot
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Grounded • 0.2 Temp
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {groundedContext ? (
                  <span>
                    Grounded in <strong>{groundedContext.name}</strong> • {groundedContext.skillsCount} skills • {groundedContext.applicationsCount} tracked applications
                  </span>
                ) : (
                  'Personalized career advisor proxying OpenRouter multi-model AI'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetSession}
            className="self-end sm:self-auto px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            title="Reset conversation to clean slate"
          >
            <RefreshCw size={13} />
            New Session
          </button>
        </div>

        {/* Quick Prompt Chips (Visible at start) */}
        {messages.length <= 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {QUICK_PROMPT_CHIPS.map((chip, idx) => {
              const Icon = chip.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 text-left transition shadow-2xs group flex items-start gap-3"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition shrink-0 mt-0.5">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition flex items-center justify-between">
                      {chip.label}
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition" />
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {chip.prompt}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Conversation Message Thread */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs overflow-y-auto space-y-6 min-h-[420px] max-h-[60vh]">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-indigo-600 border border-slate-200'
                }`}
              >
                {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'
                }`}
              >
                {/* Content formatted */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Model / Source Footer on Assistant Messages */}
                {msg.role === 'assistant' && msg.modelUsed && (
                  <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Zap size={10} className="text-indigo-500" />
                      Model: {msg.modelUsed}
                    </span>
                    {msg.isFallback && (
                      <span className="text-amber-600 font-medium">Local Grounded Mode</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Sending Indicator */}
          {isSending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-indigo-600 border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                <Bot size={15} />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs p-4 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-slate-400 ml-1">
                  Grounded advisor reasoning...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your profile, match scores, or interview strategy... (Press Enter to send)"
            disabled={isSending}
            className="flex-1 resize-none p-2 text-xs bg-transparent border-0 focus:outline-hidden focus:ring-0 text-slate-800 placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isSending}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shadow-xs shrink-0 flex items-center justify-center"
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Session reset policy: Page refresh (<kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">F5</kbd>) starts a fresh in-memory session. Profile grounding is always preserved.
        </p>
      </div>
    </div>
  );
}

export default CareerPathAssistant;
