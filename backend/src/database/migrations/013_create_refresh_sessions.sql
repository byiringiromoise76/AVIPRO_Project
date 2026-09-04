CREATE TABLE IF NOT EXISTS refresh_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(500) NULL,
  ip_address VARCHAR(45) NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  replaced_by_id BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_refresh_replacement FOREIGN KEY (replaced_by_id) REFERENCES refresh_sessions(id) ON DELETE SET NULL,
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_expiry (expires_at)
) ENGINE=InnoDB;