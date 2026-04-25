import { useState, useEffect } from 'react';
import { X, MessageSquare, MapPin, Globe, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllQuestions, markQuestionRead } from '../utils/firestoreUtils';
import colors from '../utils/colors';

const LANG_LABELS = { en: 'EN', ru: 'RU', he: 'HE' };
const LANG_COLORS = {
  en: { bg: '#DBEAFE', text: '#1E40AF' },
  ru: { bg: '#FCE7F3', text: '#9D174D' },
  he: { bg: '#D1FAE5', text: '#065F46' },
};

const QuestionsModal = ({ onClose, onCountChange }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTranscripts, setExpandedTranscripts] = useState({});

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const data = await getAllQuestions();
    setQuestions(data);
    setLoading(false);
  };

  const handleMarkRead = async (question) => {
    if (question.read) return;
    await markQuestionRead(question.id);
    setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, read: true } : q));
    if (onCountChange) onCountChange(-1);
  };

  const toggleTranscript = (id) =>
    setExpandedTranscripts(prev => ({ ...prev, [id]: !prev[id] }));

  const formatDate = (ts) => {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Side panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-200"
          style={{ background: `linear-gradient(135deg, ${colors.primary.teal}, #0097A7)` }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Visitor Questions</h2>
            {questions.filter(q => !q.read).length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {questions.filter(q => !q.read).length} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No questions yet</p>
              <p className="text-gray-400 text-sm mt-1">Questions from visitors will appear here</p>
            </div>
          ) : (
            questions.map((q) => {
              const isChat = q.source === 'chat_widget';
              const transcriptSep = '--- Chat Transcript ---';
              const hasTranscript = isChat && q.message?.includes(transcriptSep);
              const noteText = hasTranscript ? q.message.split(transcriptSep)[0].trim() : null;
              const transcriptText = hasTranscript ? q.message.split(transcriptSep)[1]?.trim() : null;
              const isExpanded = expandedTranscripts[q.id];

              return (
                <div
                  key={q.id}
                  onClick={() => handleMarkRead(q)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                    q.read
                      ? 'bg-white border-gray-200'
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Source badge */}
                      {isChat ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                          <MessageCircle className="w-3 h-3" /> Chat
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: '#E6F7F8', color: colors.primary.teal }}
                        >
                          <MapPin className="w-3 h-3" />
                          {q.destination}
                        </span>
                      )}
                      {/* Language badge */}
                      {q.language && (
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={LANG_COLORS[q.language] || { bg: '#F3F4F6', text: '#374151' }}
                        >
                          <Globe className="w-3 h-3" />
                          {LANG_LABELS[q.language] || q.language}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!q.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Contact info */}
                  <p className="font-semibold text-gray-900 text-sm">{q.name}</p>
                  <p className="text-xs text-gray-500">{q.email}{q.phone ? ` · ${q.phone}` : ''}</p>

                  {/* Message / transcript */}
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    {hasTranscript ? (
                      <>
                        {noteText && (
                          <p className="text-sm text-gray-700 leading-relaxed mb-2">{noteText}</p>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); toggleTranscript(q.id); }}
                          className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {isExpanded ? 'Hide transcript' : 'Show chat transcript'}
                        </button>
                        {isExpanded && (
                          <pre className="mt-2 text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-sans border border-gray-200 max-h-64 overflow-y-auto">
                            {transcriptText}
                          </pre>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed">{q.message}</p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="mt-2 text-[11px] text-gray-400">{formatDate(q.createdAt)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default QuestionsModal;
