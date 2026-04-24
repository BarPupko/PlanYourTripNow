import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Send, CheckCircle2, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { createBlogComment, getApprovedBlogComments } from '../utils/firestoreUtils';
import colors from '../utils/colors';

// Renders [[IMG:label|url]] markers as expandable inline buttons
const InlineImageButton = ({ label, url }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-block my-2 w-full">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all"
        style={{
          borderColor: colors.primary.teal,
          color: open ? 'white' : colors.primary.teal,
          backgroundColor: open ? colors.primary.teal : 'transparent',
        }}
      >
        <ImageIcon className="w-3.5 h-3.5" />
        {label}
        <span className="text-xs opacity-70">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <img
          src={url}
          alt={label}
          className="mt-2 rounded-xl w-full object-cover max-h-80 shadow-md"
        />
      )}
    </span>
  );
};

// Parse content string and split out [[IMG:label|url]] markers
const parseContent = (text) => {
  if (!text) return null;
  const parts = [];
  const pattern = /\[\[IMG:([^|]+)\|([^\]]+)\]\]/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={key++} className="whitespace-pre-wrap">{text.slice(last, match.index)}</span>);
    }
    parts.push(<InlineImageButton key={key++} label={match[1]} url={match[2]} />);
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(<span key={key++} className="whitespace-pre-wrap">{text.slice(last)}</span>);
  }
  return parts;
};

const BlogPostModal = ({ post, onClose, previewMode = false }) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(!previewMode);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (previewMode || !post?.id) return;
    setCommentsLoading(true);
    getApprovedBlogComments(post.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [post?.id, previewMode]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBlogComment({
        postId: post.id,
        authorName: commentForm.name,
        authorEmail: commentForm.email,
        content: commentForm.content,
        approved: false,
      });
      setSuccess(true);
      setCommentForm({ name: '', email: '', content: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const images = post?.images || [];
  const isHtmlContent = post?.content && /<[a-z][\s\S]*>/i.test(post.content);
  const renderedContent = isHtmlContent ? null : parseContent(post?.content || '');

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-2 sticky top-0 bg-white rounded-t-2xl z-10 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{post?.title}</h2>
            {previewMode && (
              <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Preview — not yet published
              </span>
            )}
          </div>
          <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Date */}
        {post?.publishedAt && !previewMode && (
          <p className="px-6 pt-2 text-sm text-gray-400">
            {post.publishedAt.toDate?.().toLocaleDateString('en-CA', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        )}

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="relative mt-4 mx-6">
            <img
              src={images[imageIndex]}
              alt={`Post image ${imageIndex + 1}`}
              className="w-full h-64 sm:h-80 object-cover rounded-xl"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImageIndex(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setImageIndex(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="flex justify-center gap-1.5 mt-3">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImageIndex(i)}
                      className={`h-2 rounded-full transition-all ${i === imageIndex ? 'w-5' : 'w-2 bg-gray-300'}`}
                      style={i === imageIndex ? { backgroundColor: colors.primary.teal } : {}}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        {isHtmlContent ? (
          <div
            className="blog-content px-6 mt-5 text-gray-700 text-sm sm:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <div className="px-6 mt-5 text-gray-700 text-sm sm:text-base leading-relaxed">
            {renderedContent}
          </div>
        )}

        {/* Comments — hidden in preview mode */}
        {!previewMode && (
          <div className="px-6 mt-8 pb-6">
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" style={{ color: colors.primary.teal }} />
                Comments {!commentsLoading && `(${comments.length})`}
              </h3>

              {commentsLoading ? (
                <div className="text-sm text-gray-400 py-4">Loading comments…</div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-400 mb-6">No comments yet. Be the first!</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {comments.map(c => (
                    <div key={c.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{c.authorName}</span>
                        {c.createdAt && (
                          <span className="text-xs text-gray-400">
                            {c.createdAt.toDate?.().toLocaleDateString('en-CA', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {success ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: colors.primary.teal }} />
                  <p className="text-sm font-medium text-gray-700">Comment submitted!</p>
                  <p className="text-xs text-gray-400 mt-1">It will appear after admin approval.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitComment} className="space-y-3 border-t pt-5">
                  <h4 className="text-sm font-semibold text-gray-700">Leave a Comment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" required placeholder="Your name"
                      value={commentForm.name}
                      onChange={e => setCommentForm(p => ({ ...p, name: e.target.value }))}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                    />
                    <input type="email" required placeholder="Email (not published)"
                      value={commentForm.email}
                      onChange={e => setCommentForm(p => ({ ...p, email: e.target.value }))}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                    />
                  </div>
                  <textarea required rows={3} placeholder="Write your comment…"
                    value={commentForm.content}
                    onChange={e => setCommentForm(p => ({ ...p, content: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm resize-none"
                  />
                  <button type="submit" disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: colors.primary.teal }}
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting…' : 'Submit Comment'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Preview mode footer */}
        {previewMode && (
          <div className="px-6 pb-6 mt-6">
            <div className="text-center text-sm text-gray-400 border-t pt-4">
              Comments section will appear here for visitors
            </div>
          </div>
        )}
      </div>

      <style>{`
        .blog-content h2 { font-size: 1.3rem; font-weight: 700; margin: 1rem 0 0.4rem; color: #111827; }
        .blog-content h3 { font-size: 1.05rem; font-weight: 700; margin: 0.75rem 0 0.3rem; color: #111827; }
        .blog-content p { margin: 0.4rem 0; }
        .blog-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .blog-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .blog-content li { margin: 0.2rem 0; }
        .blog-content blockquote {
          border-left: 3px solid #00BCD4;
          padding: 0.5rem 1rem;
          margin: 0.75rem 0;
          color: #6b7280;
          font-style: italic;
          background: #f0faf8;
          border-radius: 0 6px 6px 0;
        }
        .blog-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
        .blog-content a { color: #00BCD4; text-decoration: underline; }
        .blog-content strong, .blog-content b { font-weight: 700; }
        .blog-content em, .blog-content i { font-style: italic; }
      `}</style>
    </div>
  );
};

export default BlogPostModal;
