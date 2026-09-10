-- 003_create_customers.sql
-- Customers table for guest checkout - customers don't create accounts,
-- they provide details when placing orders for tracking purposes

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address VARCHAR(255) NOT NULL,
  business_name VARCHAR(150) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_customers_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id),

  UNIQUE KEY uq_customers_phone_branch (phone, branch_id),
  INDEX idx_customers_branch (branch_id),
  INDEX idx_customers_phone (phone)
) ENGINE=InnoDB;