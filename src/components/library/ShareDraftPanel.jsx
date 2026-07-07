import React from 'react';
import { CheckCircle2, Copy, Link2, Share2 } from 'lucide-react';

function ShareDraftPanel({
  draft,
  importCode,
  onImportCodeChange,
  onImportFromCode,
  shareCode,
  shareUrl,
  onCopyCode,
  onCopyUrl,
  status,
}) {
  if (!draft) return null;

  return (
    <article className="library-section card-panel share-card">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Share Draft</p>
          <h4>Generate a shareable draft link</h4>
        </div>
      </div>

      <div className="share-grid">
        <div className="share-block">
          <span>Draft Code</span>
          <div className="share-row">
            <code>{shareCode || '—'}</code>
            <button className="ghost-button" onClick={onCopyCode}><Copy size={14} /> Copy</button>
          </div>
        </div>
        <div className="share-block">
          <span>Shareable URL</span>
          <div className="share-row">
            <code>{shareUrl || '—'}</code>
            <button className="ghost-button" onClick={onCopyUrl}><Link2 size={14} /> Copy</button>
          </div>
        </div>
      </div>

      <div className="share-import-row">
        <input value={importCode} onChange={(event) => onImportCodeChange(event.target.value)} placeholder="Paste draft code or URL" />
        <button className="ghost-button" onClick={onImportFromCode}><Share2 size={14} /> Import</button>
      </div>

      {status ? (
        <div className="share-status">
          <CheckCircle2 size={14} />
          <span>{status}</span>
        </div>
      ) : null}
    </article>
  );
}

export default ShareDraftPanel;
