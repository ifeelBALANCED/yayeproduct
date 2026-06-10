-- ============================================================
-- v1.4 alignment — bump prompt_version default, refresh comments.
-- Historical rows are intentionally NOT backfilled — their original
-- prompt_version is part of the audit trail.
-- ============================================================

-- prompt_version default → 'v1.4' (was 'v1.3' in 20240101000002)
ALTER TABLE messages
  ALTER COLUMN prompt_version SET DEFAULT 'v1.4';

COMMENT ON COLUMN messages.prompt_version IS
  'Snapshot of the system-prompt version (canonical /docs/system-prompt-canonical.md) used to generate this message. Used for audit and regression analysis. Bumped via ANTHROPIC_PROMPT_VERSION env var at runtime.';
