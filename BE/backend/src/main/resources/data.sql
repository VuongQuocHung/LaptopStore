-- Idempotent seed data for catalog entities.
-- This script is written for MySQL.

INSERT INTO brands (name, logo_url)
VALUES
    ('Dell', 'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg'),
    ('ASUS', 'https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg'),
    ('Lenovo', 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg'),
    ('Apple', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'),
    ('MSI', 'https://upload.wikimedia.org/wikipedia/commons/9/93/Msi-logo.svg')
ON DUPLICATE KEY UPDATE
    logo_url = VALUES(logo_url);

INSERT INTO categories (name, description)
VALUES
    ('Gaming', 'High performance laptops for gaming and demanding tasks'),
    ('Ultrabook', 'Thin and light laptops for mobility and daily work'),
    ('Office', 'Balanced laptops for office workloads and study'),
    ('Creator', 'Laptops optimized for design, video, and content creation')
ON DUPLICATE KEY UPDATE
    description = VALUES(description);

INSERT INTO products (name, price, import_price, stock, description, brand_id, category_id, created_at, updated_at)
SELECT
    'Dell G15 5530', 25990000.00, 22000000.00, 15,
    '15.6 inch gaming laptop with Intel Core i7 and RTX graphics',
    b.id, c.id, NOW(), NOW()
FROM brands b
JOIN categories c ON c.name = 'Gaming'
WHERE b.name = 'Dell'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'Dell G15 5530');

INSERT INTO products (name, price, import_price, stock, description, brand_id, category_id, created_at, updated_at)
SELECT
    'ASUS ROG Zephyrus G14', 32990000.00, 28700000.00, 10,
    'Compact premium gaming laptop with strong CPU and GPU performance',
    b.id, c.id, NOW(), NOW()
FROM brands b
JOIN categories c ON c.name = 'Gaming'
WHERE b.name = 'ASUS'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'ASUS ROG Zephyrus G14');

INSERT INTO products (name, price, import_price, stock, description, brand_id, category_id, created_at, updated_at)
SELECT
    'Lenovo ThinkPad X1 Carbon Gen 11', 41990000.00, 37000000.00, 8,
    'Business ultrabook with premium keyboard and long battery life',
    b.id, c.id, NOW(), NOW()
FROM brands b
JOIN categories c ON c.name = 'Ultrabook'
WHERE b.name = 'Lenovo'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'Lenovo ThinkPad X1 Carbon Gen 11');

INSERT INTO products (name, price, import_price, stock, description, brand_id, category_id, created_at, updated_at)
SELECT
    'MacBook Air M2 13', 27990000.00, 24500000.00, 12,
    'Lightweight laptop powered by Apple M2 chip for everyday productivity',
    b.id, c.id, NOW(), NOW()
FROM brands b
JOIN categories c ON c.name = 'Ultrabook'
WHERE b.name = 'Apple'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'MacBook Air M2 13');

INSERT INTO products (name, price, import_price, stock, description, brand_id, category_id, created_at, updated_at)
SELECT
    'MSI Creator M16', 36990000.00, 32100000.00, 6,
    'Creator laptop tuned for design workflows and media production',
    b.id, c.id, NOW(), NOW()
FROM brands b
JOIN categories c ON c.name = 'Creator'
WHERE b.name = 'MSI'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'MSI Creator M16');

INSERT INTO product_specifications (product_id, cpu, ram, storage, vga, screen, os, battery, weight)
SELECT
    p.id,
    'Intel Core i7-13650HX',
    '16GB DDR5',
    '512GB SSD',
    'NVIDIA GeForce RTX 4050',
    '15.6 inch FHD 165Hz',
    'Windows 11',
    '86Wh',
    '2.65kg'
FROM products p
WHERE p.name = 'Dell G15 5530'
  AND NOT EXISTS (SELECT 1 FROM product_specifications ps WHERE ps.product_id = p.id);

INSERT INTO product_specifications (product_id, cpu, ram, storage, vga, screen, os, battery, weight)
SELECT
    p.id,
    'AMD Ryzen 9 7940HS',
    '32GB LPDDR5',
    '1TB SSD',
    'NVIDIA GeForce RTX 4060',
    '14 inch QHD 165Hz',
    'Windows 11',
    '76Wh',
    '1.65kg'
FROM products p
WHERE p.name = 'ASUS ROG Zephyrus G14'
  AND NOT EXISTS (SELECT 1 FROM product_specifications ps WHERE ps.product_id = p.id);

INSERT INTO product_specifications (product_id, cpu, ram, storage, vga, screen, os, battery, weight)
SELECT
    p.id,
    'Intel Core i7-1365U',
    '16GB LPDDR5',
    '1TB SSD',
    'Intel Iris Xe Graphics',
    '14 inch WUXGA',
    'Windows 11 Pro',
    '57Wh',
    '1.12kg'
FROM products p
WHERE p.name = 'Lenovo ThinkPad X1 Carbon Gen 11'
  AND NOT EXISTS (SELECT 1 FROM product_specifications ps WHERE ps.product_id = p.id);

INSERT INTO product_specifications (product_id, cpu, ram, storage, vga, screen, os, battery, weight)
SELECT
    p.id,
    'Apple M2',
    '16GB Unified Memory',
    '512GB SSD',
    'Apple Integrated GPU',
    '13.6 inch Liquid Retina',
    'macOS',
    '52.6Wh',
    '1.24kg'
FROM products p
WHERE p.name = 'MacBook Air M2 13'
  AND NOT EXISTS (SELECT 1 FROM product_specifications ps WHERE ps.product_id = p.id);

INSERT INTO product_specifications (product_id, cpu, ram, storage, vga, screen, os, battery, weight)
SELECT
    p.id,
    'Intel Core i9-13900H',
    '32GB DDR5',
    '1TB SSD',
    'NVIDIA GeForce RTX 4070',
    '16 inch QHD+',
    'Windows 11',
    '99.9Wh',
    '2.26kg'
FROM products p
WHERE p.name = 'MSI Creator M16'
  AND NOT EXISTS (SELECT 1 FROM product_specifications ps WHERE ps.product_id = p.id);

INSERT INTO product_images (product_id, image_url, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1593640495253-23196b27a87f', TRUE
FROM products p
WHERE p.name = 'Dell G15 5530'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.image_url = 'https://images.unsplash.com/photo-1593640495253-23196b27a87f'
  );

INSERT INTO product_images (product_id, image_url, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8', TRUE
FROM products p
WHERE p.name = 'ASUS ROG Zephyrus G14'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.image_url = 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8'
  );

INSERT INTO product_images (product_id, image_url, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853', TRUE
FROM products p
WHERE p.name = 'Lenovo ThinkPad X1 Carbon Gen 11'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.image_url = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853'
  );

INSERT INTO product_images (product_id, image_url, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1484788984921-03950022c9ef', TRUE
FROM products p
WHERE p.name = 'MacBook Air M2 13'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.image_url = 'https://images.unsplash.com/photo-1484788984921-03950022c9ef'
  );

INSERT INTO product_images (product_id, image_url, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2', TRUE
FROM products p
WHERE p.name = 'MSI Creator M16'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.image_url = 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2'
  );