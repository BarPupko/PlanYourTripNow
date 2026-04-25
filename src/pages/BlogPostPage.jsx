import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, CheckCircle2, MessageSquare, Image as ImageIcon, ArrowLeft, Share2, Check } from 'lucide-react';
import { getBlogPostById, createBlogComment, getApprovedBlogComments, updateBlogComment } from '../utils/firestoreUtils';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import colors from '../utils/colors';

// Renders [[IMG:label|url]] markers as expandable inline buttons (for old plain-text posts)
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
        <img src={url} alt={label} className="mt-2 rounded-xl w-full object-cover max-h-80 shadow-md" />
      )}
    </span>
  );
};

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

const BlogPostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [adminReplyingTo, setAdminReplyingTo] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  useEffect(() => onAuthStateChanged(auth, setAdminUser), []);

  useEffect(() => {
    getBlogPostById(postId)
      .then(data => {
        if (!data || !data.published) { setNotFound(true); }
        else { setPost(data); }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (!post?.id) return;
    getApprovedBlogComments(post.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [post?.id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleAdminReply = async (commentId) => {
    if (!adminReplyText.trim()) return;
    const replyAuthor = adminUser?.displayName || 'IVRITours';
    await updateBlogComment(commentId, { reply: adminReplyText.trim(), replyAuthor });
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, reply: adminReplyText.trim(), replyAuthor } : c));
    setAdminReplyingTo(null);
    setAdminReplyText('');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <p className="text-xl font-bold text-gray-700 mb-2">Post not found</p>
        <p className="text-sm text-gray-400 mb-6">This post may have been removed or is not yet published.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: colors.primary.teal }}>
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
      </div>
    );
  }

  const images = post.images || [];
  const isHtmlContent = post.content && /<[a-z][\s\S]*>/i.test(post.content);
  const renderedContent = isHtmlContent ? null : parseContent(post.content || '');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors" style={{ color: colors.primary.teal }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Ivri Tours
          </Link>
        </div>
      </div>

      {/* Post card */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Cover image */}
          {images.length > 0 && (
            <div className="relative">
              <img
                src={images[imageIndex]}
                alt={`Post image ${imageIndex + 1}`}
                className="w-full h-64 sm:h-80 object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setImageIndex(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="flex justify-center gap-1.5 absolute bottom-3 left-0 right-0">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setImageIndex(i)}
                        className={`h-2 rounded-full transition-all ${i === imageIndex ? 'w-5' : 'w-2 bg-white/60'}`}
                        style={i === imageIndex ? { backgroundColor: 'white' } : {}}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Header */}
          <div className="px-6 pt-6 pb-2">
            {post.category && (
              <span className="inline-block mb-3 text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: colors.primary.teal }}>
                {post.category}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">{post.title}</h1>

            <div className="flex items-center justify-between gap-3 mt-3">
              <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                {post.author && <span className="font-medium text-gray-600">By {post.author}</span>}
                {post.author && post.publishedAt && <span>·</span>}
                {post.publishedAt && (
                  <span>
                    {post.publishedAt.toDate?.().toLocaleDateString('en-CA', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                )}
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all flex-shrink-0"
                style={{
                  borderColor: shareCopied ? '#10B981' : colors.primary.teal,
                  color: shareCopied ? '#10B981' : colors.primary.teal,
                }}
              >
                {shareCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {shareCopied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>

          {/* Content */}
          {isHtmlContent ? (
            <div
              className="blog-content px-6 py-4 text-gray-700 text-sm sm:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="px-6 py-4 text-gray-700 text-sm sm:text-base leading-relaxed">
              {renderedContent}
            </div>
          )}

          {/* Comments */}
          <div className="px-6 pb-8 mt-4">
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
                      {c.reply && (
                        <div className="mt-3 pl-3 border-l-2 border-[#00BCD4]">
                          <p className="text-[11px] font-bold text-[#00BCD4] mb-0.5">{c.replyAuthor || 'IVRITours'}</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{c.reply}</p>
                        </div>
                      )}
                      {adminUser && adminReplyingTo === c.id && (
                        <div className="mt-3 flex gap-2 items-start">
                          <textarea
                            rows={2} autoFocus
                            value={adminReplyText}
                            onChange={e => setAdminReplyText(e.target.value)}
                            placeholder="Write your reply…"
                            className="flex-1 px-3 py-2 text-xs border-2 rounded-lg focus:outline-none resize-none"
                            style={{ borderColor: colors.primary.teal }}
                          />
                          <div className="flex flex-col gap-1">
                            <button onClick={() => handleAdminReply(c.id)} disabled={!adminReplyText.trim()}
                              className="px-2.5 py-1.5 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                              style={{ backgroundColor: colors.primary.teal }}>
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setAdminReplyingTo(null); setAdminReplyText(''); }}
                              className="px-2.5 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs">
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                      {adminUser && adminReplyingTo !== c.id && (
                        <button onClick={() => { setAdminReplyingTo(c.id); setAdminReplyText(c.reply || ''); }}
                          className="mt-2 text-[11px] font-semibold hover:underline"
                          style={{ color: colors.primary.teal }}>
                          {c.reply ? 'Edit reply' : '↩ Reply'}
                        </button>
                      )}
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
        </div>
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

export default BlogPostPage;
