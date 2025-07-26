// patched routes/messages.js

import express from 'express';
import { requireAuth } from '../utils/middleware.js';

const router = express.Router();

// Get all messages for current user
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  req.db.all(
    `
    SELECT
      m.id,
      m.subject,
      m.content,
      m.message_type,
      m.priority,
      m.created_at,
      sender.username    AS sender_username,
      sender.enclave     AS sender_enclave,
      recipient.username AS recipient_username,
      recipient.enclave  AS recipient_enclave
    FROM messages m
    LEFT JOIN users sender    ON m.sender_id    = sender.id
    LEFT JOIN users recipient ON m.recipient_id = recipient.id
    WHERE
      m.sender_id    = ?
      OR m.recipient_id = ?
      OR m.recipient_id IS NULL
    ORDER BY m.created_at DESC
    `,
    [userId, userId],
    (err, messages) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, error: 'Failed to fetch messages' });
      }
      res.json({ success: true, messages });
    }
  );
});

// Get a single message by ID (with ownership check)
router.get('/:id', requireAuth, (req, res) => {
  // 1) Validate & parse ID
  const messageId = parseInt(req.params.id, 10);
  if (isNaN(messageId) || messageId < 1) {
    return res
      .status(400)
      .json({ success: false, error: 'Invalid message ID' });
  }

  // 2) Fetch only if the user is sender, recipient, or it's public
  const sql = `
    SELECT
      m.id,
      m.subject,
      m.content,
      m.message_type,
      m.priority,
      m.created_at,
      sender.username    AS sender_username,
      sender.enclave     AS sender_enclave,
      recipient.username AS recipient_username,
      recipient.enclave  AS recipient_enclave
    FROM messages m
    LEFT JOIN users sender    ON m.sender_id    = sender.id
    LEFT JOIN users recipient ON m.recipient_id = recipient.id
    WHERE
      m.id = ?
      AND (
        m.sender_id    = ?
        OR m.recipient_id = ?
        OR m.recipient_id IS NULL
      )
  `;
  const params = [messageId, req.session.userId, req.session.userId];

  req.db.get(sql, params, (err, message) => {
    // Not found or not owned → 404
    if (err || !message) {
      return res
        .status(404)
        .json({ success: false, error: 'Message not found' });
    }
    // Return safe fields only
    res.json({ success: true, message });
  });
});

// Send a new message
router.post('/', requireAuth, (req, res) => {
  const { recipient_id, subject, content, message_type, priority } = req.body;
  const sender_id = req.session.userId;

  if (!subject || !content) {
    return res
      .status(400)
      .json({ success: false, error: 'Subject and content required' });
  }

  req.db.run(
    `
    INSERT INTO messages
      (sender_id, recipient_id, subject, content, message_type, priority)
    VALUES
      (?, ?, ?, ?, ?, ?)
    `,
    [
      sender_id,
      recipient_id,
      subject,
      content,
      message_type || 'personal',
      priority      || 'normal'
    ],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, error: 'Failed to send message' });
      }
      res.json({
        success:   true,
        message:   'Message sent successfully',
        messageId: this.lastID
      });
    }
  );
});

export { router as messageRoutes };
