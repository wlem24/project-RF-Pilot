// src/components/collaboration/CollaborationTab.jsx
import { useState, useRef, useEffect } from 'react';
import { RiSendPlaneLine, RiReplyLine, RiUserLine } from 'react-icons/ri';
import { EmptyState } from '../../common/index.jsx';
import styles from './CollaborationTab.module.css';

// ── Mock mention users (UI only — no backend) ─────────────────
const MENTION_USERS = [
  { id: 1, name: 'Project Manager',  handle: 'ProjectManager',  role: 'PM'              },
  { id: 2, name: 'Sales Lead',       handle: 'SalesLead',       role: 'Sales'           },
  { id: 3, name: 'Technical Lead',   handle: 'TechnicalLead',   role: 'Engineering'     },
  { id: 4, name: 'Finance Reviewer', handle: 'FinanceReviewer', role: 'Finance'         },
  { id: 5, name: 'Legal Advisor',    handle: 'LegalAdvisor',    role: 'Legal & Compliance' },
];

// ── Render text with @mention highlights ─────────────────────
function MentionText({ text }) {
  return (
    <p className={styles.commentText}>
      {text.split(/(@\w+)/g).map((part, i) =>
        part.startsWith('@')
          ? <span key={i} className={styles.mention}>{part}</span>
          : <span key={i}>{part}</span>
      )}
    </p>
  );
}

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const initials = name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const hue      = (name?.charCodeAt(0) || 0) * 137 % 360;
  return (
    <div className={styles.avatar} style={{ width: size, height: size, background: `hsl(${hue},52%,44%)`, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

// ── Mention Dropdown ──────────────────────────────────────────
function MentionDropdown({ query, onSelect }) {
  const filtered = MENTION_USERS.filter((u) =>
    u.handle.toLowerCase().startsWith(query.toLowerCase()) ||
    u.name.toLowerCase().includes(query.toLowerCase())
  );
  if (filtered.length === 0) return null;

  return (
    <div className={styles.mentionDropdown}>
      <div className={styles.mentionDropdownHeader}>
        <RiUserLine className={styles.mentionDropdownIcon} /> Mention someone
      </div>
      {filtered.map((u) => (
        <button key={u.id} className={styles.mentionItem} onClick={() => onSelect(u)}>
          <Avatar name={u.name} size={28} />
          <div>
            <p className={styles.mentionName}>@{u.handle}</p>
            <p className={styles.mentionRole}>{u.role}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Comment Input ─────────────────────────────────────────────
function CommentInput({ placeholder, onSubmit, compact }) {
  const [text,       setText]        = useState('');
  const [showMention,setShowMention] = useState(false);
  const [mentionQ,   setMentionQ]    = useState('');
  const textareaRef = useRef(null);

  const handleChange = (val) => {
    setText(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1) {
      const query = val.slice(lastAt + 1);
      if (!query.includes(' ') && query.length <= 20) {
        setMentionQ(query);
        setShowMention(true);
        return;
      }
    }
    setShowMention(false);
  };

  const insertMention = (user) => {
    const lastAt = text.lastIndexOf('@');
    setText(text.slice(0, lastAt) + `@${user.handle} `);
    setShowMention(false);
    textareaRef.current?.focus();
  };

  const submit = () => {
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
    setShowMention(false);
  };

  return (
    <div className={styles.commentInputWrap}>
      <div className={styles.commentInputInner}>
        <textarea
          ref={textareaRef}
          className={`input textarea ${styles.commentTextarea}`}
          rows={compact ? 2 : 3}
          placeholder={placeholder || 'Add a comment or decision note...'}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
        />
        {showMention && (
          <MentionDropdown query={mentionQ} onSelect={insertMention} />
        )}
      </div>
      <button className="btn btn-primary" onClick={submit} disabled={!text.trim()}>
        <RiSendPlaneLine />
        {compact ? 'Reply' : 'Post Comment'}
      </button>
      <p className={styles.inputHint}>Ctrl+Enter to submit • @ to mention</p>
    </div>
  );
}

// ── Single comment ─────────────────────────────────────────────
function CommentItem({ comment, onReply }) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className={styles.commentItem}>
      <Avatar name={comment.authorName} />
      <div className={styles.commentBody}>
        {/* Header */}
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>{comment.authorName}</span>
          <span className={styles.commentRole}>{comment.authorRole}</span>
          <span className={styles.commentTime}>{comment.createdAt}</span>
        </div>

        {/* Message */}
        <MentionText text={comment.message} />

        {/* Reply button */}
        <button className={styles.replyBtn} onClick={() => setShowReply(!showReply)}>
          <RiReplyLine /> Reply
        </button>

        {/* Reply input */}
        {showReply && (
          <div className={styles.replyInputWrap}>
            <CommentInput
              compact
              placeholder="Write a reply…"
              onSubmit={(msg) => {
                onReply(comment.id, msg);
                setShowReply(false);
              }}
            />
          </div>
        )}

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className={styles.repliesList}>
            {comment.replies.map((r) => (
              <div key={r.id} className={styles.replyItem}>
                <Avatar name={r.authorName} size={28} />
                <div className={styles.commentBody}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor} style={{ fontSize: 12 }}>{r.authorName}</span>
                    <span className={styles.commentTime}>{r.createdAt}</span>
                  </div>
                  <MentionText text={r.message} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Collaboration Tab ─────────────────────────────────────
export default function CollaborationTab({ rfpId, comments: initComments = [], onPostComment }) {
  // Local comment state — merges with API data
  const [comments, setComments] = useState(initComments);
  let idRef = useRef(1000);

  // Sync with API comments
  useEffect(() => { setComments(initComments); }, [initComments]);

  const addComment = (msg) => {
    // 🔌 API hook: POST /rfps/{rfpId}/comments { message: msg }
    const newComment = {
      id:          `local-${idRef.current++}`,
      authorId:    'me',
      authorName:  'You',
      authorRole:  'Current User',
      message:     msg,
      createdAt:   new Date().toLocaleString(),
      replies:     [],
    };
    setComments((prev) => [...prev, newComment]);
    onPostComment?.(msg);
  };

  const addReply = (commentId, msg) => {
    // 🔌 API hook: POST /rfps/{rfpId}/comments/{commentId}/replies { message: msg }
    setComments((prev) => prev.map((c) =>
      c.id === commentId
        ? { ...c, replies: [...(c.replies || []), {
              id: `reply-${idRef.current++}`,
              authorName: 'You',
              message: msg,
              createdAt: new Date().toLocaleString(),
            }]}
        : c
    ));
  };

  return (
    <div className="card">
      <h2 className="card-title">Audit Trail & Comments</h2>
      <div className="accent-bar" />

      {/* Comment list */}
      {comments.length === 0 ? (
        <EmptyState compact icon="💬" title="No comments yet" description="Start the discussion below" />
      ) : (
        <div className={styles.commentList}>
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} onReply={addReply} />
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className={styles.newCommentSection}>
        <CommentInput onSubmit={addComment} />
      </div>
    </div>
  );
}
