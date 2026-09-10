-- 006_create_orders.sql
-- Orders are logged by Customer Service on behalf of a customer whose request
-- came in outside the system (phone call, WhatsApp, in person). There is no
-- guest submission and no separate DELIVERY role — Customer Service owns both
-- the intake/approval end and the final ready-for-delivery/closeout end.

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  branch_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,

  -- Staff member who logged the request into the system.
  customer_service_id BIGINT UNSIGNED NULL,

  -- Optional: staff member who originally took the sale (if different from
  -- the person who logged it).
  salesperson_id BIGINT UNSIGNED NULL,

  order_code VARCHAR(50) NOT NULL,

  status ENUM(
    'PENDING',                    -- Logged by Customer Service, awaiting approval
    'APPROVED',                   -- Customer Service Manager approved
    'REJECTED',                   -- Customer Service Manager rejected
    'PROCESSING',                 -- Processing Manager has started work
    'PROCESSING_COMPLETED',       -- Processing Manager marked it done
    'READY_FOR_DELIVERY',         -- Customer Service Manager prepared it for hand-off
    'DELIVERED',                  -- Customer Service Manager closed the order
    'CANCELLED'                   -- Cancelled at any stage before delivery
  ) NOT NULL DEFAULT 'PENDING',

  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  rejection_reason TEXT NULL,
  internal_notes TEXT NULL,

  customer_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  customer_confirmed_at DATETIME(3) NULL,

  requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  approved_at DATETIME(3) NULL,
  processing_started_at DATETIME(3) NULL,
  processing_completed_at DATETIME(3) NULL,
  ready_for_delivery_at DATETIME(3) NULL,
  delivered_at DATETIME(3) NULL,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_orders_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id),

  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id),

  CONSTRAINT fk_orders_customer_service
    FOREIGN KEY (customer_service_id) REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_orders_salesperson
    FOREIGN KEY (salesperson_id) REFERENCES users(id)
    ON DELETE SET NULL,

  UNIQUE KEY uq_orders_code (order_code),
  INDEX idx_orders_status (status),
  INDEX idx_orders_branch_status (branch_id, status),
  INDEX idx_orders_customer (customer_id)
) ENGINE=InnoDB;