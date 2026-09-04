CREATE TABLE IF NOT EXISTS delivery (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  delivery_person_id BIGINT UNSIGNED NULL,
  delivery_address VARCHAR(255) NOT NULL,
  status ENUM('PENDING', 'DISPATCHED', 'DELIVERED') NOT NULL DEFAULT 'PENDING',
  customer_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  customer_confirmed_at DATETIME(3) NULL,
  scheduled_at DATETIME(3) NULL,
  dispatched_at DATETIME(3) NULL,
  delivered_at DATETIME(3) NULL,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_delivery_user FOREIGN KEY (delivery_person_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_delivery_order (order_id),
  INDEX idx_delivery_status (status)
) ENGINE=InnoDB;