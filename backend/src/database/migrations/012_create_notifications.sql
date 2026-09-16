-- 012_create_notifications.sql
-- Notifications table for in-app notifications.
-- Users receive notifications for order events (processing complete, ready for delivery, etc.)
-- Notifications have a type for categorization and an is_read flag for tracking unread items.

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('ORDER_HANDOFF', 'PROCESSING_COMPLETE', 'DELIVERY_UPDATE', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_unread (user_id, is_read),
  INDEX idx_notifications_order (order_id)
) ENGINE=InnoDB;
