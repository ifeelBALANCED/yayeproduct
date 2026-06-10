-- Rename clinical_* fields to review_* in crisis_events
ALTER TABLE crisis_events
  RENAME COLUMN clinical_review_at TO review_at;
ALTER TABLE crisis_events
  RENAME COLUMN clinical_review_by TO review_by;
ALTER TABLE crisis_events
  RENAME COLUMN clinical_notes TO review_notes;

-- Add prompt_version to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS prompt_version text DEFAULT 'v1.3';

-- Add comment indicating wellness positioning
COMMENT ON TABLE crisis_events IS 'Crisis signal events. Reviewed by product safety team — wellness product, not medical.';
