import { useState, useRef, useEffect, useCallback } from 'react';
import { RiSendPlaneLine, RiReplyLine, RiUserLine } from 'react-icons/ri';
import { EmptyState } from '../../common/index.jsx';
import { MessageSquareIcon } from '../../icons/Icons.jsx';
import { commentApi } from '../../../services/api.js';
import { useAsync }   from '../../../hooks/useAsync.js';
import styles from './CollaborationTab.module.css';

const MENTION_USERS = [
  { id: 1, name: 'Project Manager',  handle: 'ProjectManager',  role: 'PM'              },
  { id: 2, name: 'Sales Lead',       handle: 'SalesLead',       role: 'Sales'           },
  { id: 3, name: 'Technical Lead',   handle: 'TechnicalLead',   role: 'Engineering'     },
  { id: 4, name: 'Finance Reviewer', handle: 'FinanceReviewer', role: 'Finance'         },
  { id: 5, name: 'Legal Advisor',    handle: 'LegalAdvisor',    role: 'Legal'           },
];

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

function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const hue      = (name?.charCodeAt(0) || 0) * 137 % 360;
  return (
    <div className={styles.avatar} style={{ width: size, height: size, background: `hsl(${hue},52%,44%)`, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function MentionDropdown({ query, onSelect }) {
  const filtered = MENTION_USERS.filter(u =>
    u.handle.toLowerCase().startsWith(query.toLowerCase()) ||
    u.name.toLowerCase().includes(query.toLowerCase())
  );
  if (filtered.length === 0) return null;
  return (
    <div className={styles.mentionDropdown}>
      <div className={styles.mentionDropdownHeader}>
        <RiUserLine className={styles.mentionDropdownIcon} /> Mention someone
      </div>
      {filtered.map(u => (
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

function CommentInput({ placeholder, onSubmit, compact, disabled }) {
  const [text, setText]               = useState('');
  const [showMention, setShowMention] = useState(false);
  const [mentionQ, setMentionQ]       = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const textareaRef = useRef(null);

  function handleChange(val) {
    setText(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1) {
      const q = val.slice(lastAt + 1);
      if (!q.includes(' ') && q.length <= 20) {
        setMentionQ(q); setShowMention(true); return;
      }
    }
    setShowMention(false);
  }

  function insertMention(user) {
    const lastAt = text.lastIndexOf('@');
    setText(text.slice(0, lastAt) + `@${user.handle} `);
    setShowMention(false);
    textareaRef.current?.focus();
  }

  async function submit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
      setShowMention(false);
    }
  }

  return (
    <div className={styles.commentInputWrap}>
      <div className={styles.commentInputInner}>
        <textarea
          ref={textareaRef}
          className={`input textarea ${styles.commentTextarea}`}
          rows={compact ? 2 : 3}
          placeholder={placeholder || 'Add a comment or decision note...'}
          value={text}
          disabled={disabled || submitting}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
        />
        {showMention && <MentionDropdown query={mentionQ} onSelect={insertMention} />}
      </div>
      <button className="btn btn-primary" onClick={submit} disabled={!text.trim() || submitting}>
        <RiSendPlaneLine />
        {submitting ? 'Posting…' : compact ? 'Reply' : 'Post Comment'}
      </button>
      <p className={styles.inputHint}>Ctrl+Enter to submit • @ to mention</p>
    </div>
  );
}

function CommentItem({ comment, rfpId, onRefresh }) {
  const [showReply, setShowReply] = useState(false);

  async function handleReply(msg) {
    await commentApi.create(rfpId, msg, comment.id);
    onRefresh();
    setShowReply(false);
  }

  return (
    <div className={styles.commentItem}>
      <Avatar name={comment.authorName} />
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>{comment.authorName}</span>
          <span className={styles.commentRole}>{comment.authorRole}</span>
          <span className={styles.commentTime}>
            {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
          </span>
        </div>
        <MentionText text={comment.message} />
        <button className={styles.replyBtn} onClick={() => setShowReply(v => !v)}>
          <RiReplyLine /> Reply
        </button>
        {showReply && (
          <div className={styles.replyInputWrap}>
            <CommentInput compact placeholder="Write a reply…" onSubmit={handleReply} />
          </div>
        )}
        {(comment.replies || []).length > 0 && (
          <div className={styles.repliesList}>
            {comment.replies.map(r => (
              <div key={r.id} className={styles.replyItem}>
                <Avatar name={r.authorName} size={28} />
                <div className={styles.commentBody}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor} style={{ fontSize: 12 }}>{r.authorName}</span>
                    <span className={styles.commentTime}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                    </span>
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

export default function CollaborationTab({ rfpId }) {
  const commentsState = useAsync(
    () => rfpId ? commentApi.list(rfpId).then(r => r.data || []) : Promise.resolve([]),
    [rfpId]
  );

  const comments = commentsState.data || [];

  async function handlePost(msg) {
    await commentApi.create(rfpId, msg, null);
    commentsState.refetch();
  }

  return (
    <div className="card">
      <h2 className="card-title">Audit Trail &amp; Comments</h2>
      <div className="accent-bar" />

      {commentsState.loading ? (
        <div className="skeleton" style={{ height: 60, borderRadius: 8 }} />
      ) : comments.length === 0 ? (
        <EmptyState compact icon={<MessageSquareIcon size={40} color="#94A3B8" />} title="No comments yet" description="Start the discussion below" />
      ) : (
        <div className={styles.commentList}>
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              rfpId={rfpId}
              onRefresh={commentsState.refetch}
            />
          ))}
        </div>
      )}

      <div className={styles.newCommentSection}>
        <CommentInput onSubmit={handlePost} disabled={!rfpId} />
      </div>
    </div>
  );
}
