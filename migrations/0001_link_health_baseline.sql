CREATE TABLE availability_observation (
  id TEXT PRIMARY KEY
    CHECK (length(trim(id)) BETWEEN 1 AND 128),
  destination_id TEXT NOT NULL
    CHECK (length(trim(destination_id)) BETWEEN 1 AND 128),
  checked_at TEXT NOT NULL
    CHECK (
      length(checked_at) = 24
      AND strftime('%Y-%m-%dT%H:%M:%fZ', checked_at) = checked_at
    ),
  method TEXT NOT NULL
    CHECK (method IN ('head', 'get', 'manual')),
  http_status INTEGER
    CHECK (
      http_status IS NULL
      OR (typeof(http_status) = 'integer' AND http_status BETWEEN 100 AND 599)
  ),
  final_url TEXT
    CHECK (
      final_url IS NULL
      OR (
        length(final_url) BETWEEN 9 AND 2048
        AND substr(final_url, 1, 8) = 'https://'
        AND instr(final_url, '@') = 0
        AND instr(final_url, '?') = 0
        AND instr(final_url, '#') = 0
        AND instr(final_url, char(9)) = 0
        AND instr(final_url, char(10)) = 0
        AND instr(final_url, char(13)) = 0
        AND instr(final_url, char(32)) = 0
        AND instr(final_url, char(92)) = 0
        AND length(
          substr(
            final_url,
            9,
            instr(substr(final_url, 9) || '/', '/') - 1
          )
        ) > 0
        AND substr(
          final_url,
          9,
          instr(substr(final_url, 9) || '/', '/') - 1
        ) = lower(
          substr(
            final_url,
            9,
            instr(substr(final_url, 9) || '/', '/') - 1
          )
        )
        AND substr(final_url, 9, 1) NOT IN ('.', '-', '/')
        AND substr(
          substr(
            final_url,
            9,
            instr(substr(final_url, 9) || '/', '/') - 1
          ),
          -1,
          1
        ) NOT IN ('.', '-')
        AND instr(
          substr(
            final_url,
            9,
            instr(substr(final_url, 9) || '/', '/') - 1
          ),
          '..'
        ) = 0
      )
    ),
  latency_ms INTEGER
    CHECK (
      latency_ms IS NULL
      OR (typeof(latency_ms) = 'integer' AND latency_ms >= 0)
    ),
  error_code TEXT
    CHECK (error_code IS NULL OR length(error_code) BETWEEN 1 AND 128),
  operator_note TEXT
    CHECK (operator_note IS NULL OR length(operator_note) BETWEEN 1 AND 500),
  classification TEXT NOT NULL
    CHECK (classification IN ('available', 'unavailable', 'unknown', 'error')),
  confidence REAL NOT NULL
    CHECK (
      typeof(confidence) IN ('integer', 'real')
      AND confidence BETWEEN 0.0 AND 1.0
    )
);

CREATE INDEX availability_observation_destination_checked_at_idx
  ON availability_observation (destination_id, checked_at DESC);

CREATE TRIGGER availability_observation_reject_update
BEFORE UPDATE ON availability_observation
BEGIN
  SELECT RAISE(ABORT, 'availability_observation is append-only');
END;

CREATE TRIGGER availability_observation_reject_delete
BEFORE DELETE ON availability_observation
BEGIN
  SELECT RAISE(ABORT, 'availability_observation is append-only');
END;

CREATE TABLE destination_current_status (
  destination_id TEXT PRIMARY KEY
    CHECK (length(trim(destination_id)) BETWEEN 1 AND 128),
  latest_observation_id TEXT
    REFERENCES availability_observation (id) ON DELETE RESTRICT,
  manual_classification TEXT
    CHECK (
      manual_classification IS NULL
      OR manual_classification IN ('available', 'unavailable', 'unknown', 'error')
    ),
  manual_reason TEXT
    CHECK (manual_reason IS NULL OR length(trim(manual_reason)) BETWEEN 1 AND 500),
  updated_at TEXT NOT NULL
    CHECK (
      length(updated_at) = 24
      AND strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) = updated_at
    ),
  CHECK (latest_observation_id IS NOT NULL OR manual_classification IS NOT NULL),
  CHECK (
    (manual_classification IS NULL AND manual_reason IS NULL)
    OR (manual_classification IS NOT NULL AND manual_reason IS NOT NULL)
  )
);

CREATE TRIGGER destination_current_status_match_insert
BEFORE INSERT ON destination_current_status
WHEN NEW.latest_observation_id IS NOT NULL
  AND (
    SELECT destination_id
    FROM availability_observation
    WHERE id = NEW.latest_observation_id
  ) IS NOT NEW.destination_id
BEGIN
  SELECT RAISE(ABORT, 'latest observation belongs to a different destination');
END;

CREATE TRIGGER destination_current_status_match_update
BEFORE UPDATE OF destination_id, latest_observation_id ON destination_current_status
WHEN NEW.latest_observation_id IS NOT NULL
  AND (
    SELECT destination_id
    FROM availability_observation
    WHERE id = NEW.latest_observation_id
  ) IS NOT NEW.destination_id
BEGIN
  SELECT RAISE(ABORT, 'latest observation belongs to a different destination');
END;
