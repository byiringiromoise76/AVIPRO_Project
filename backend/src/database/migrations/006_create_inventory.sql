CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity_available DECIMAL(14,3) NOT NULL DEFAULT 0,
  quantity_reserved DECIMAL(14,3) NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_inventory_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY uq_inventory_branch_product (branch_id, product_id)
) ENGINE=InnoDB;