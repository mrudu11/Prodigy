CREATE DATABASE IF NOT EXISTS local_store;
USE local_store;

DROP TABLE IF EXISTS support_messages, reviews, order_items, orders, products;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(60) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('Placed','Packed','Out for delivery','Delivered','Cancelled') DEFAULT 'Placed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE support_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, description, price, image_url, category, stock) VALUES
('Basmati Rice 5 kg', 'Long-grain aged basmati. Fluffy and fragrant, good for biryani and everyday meals.', 520.00, 'https://picsum.photos/seed/rice/600/450', 'Grocery', 40),
('Cold-pressed Groundnut Oil 1 L', 'Locally pressed oil with a nutty aroma. No additives.', 210.00, 'https://picsum.photos/seed/oil/600/450', 'Grocery', 25),
('Jaggery Block 1 kg', 'Traditional sugarcane jaggery, made in small batches.', 85.00, 'https://picsum.photos/seed/jaggery/600/450', 'Grocery', 60),
('Fresh Paneer 250 g', 'Soft paneer made this morning from whole milk.', 95.00, 'https://picsum.photos/seed/paneer/600/450', 'Dairy', 15),
('Full Cream Milk 1 L', 'Pasteurised milk from nearby dairy farms.', 62.00, 'https://picsum.photos/seed/milk/600/450', 'Dairy', 50),
('Seasonal Fruit Basket', 'Mixed seasonal fruit, about 2 kg, picked by the shop.', 250.00, 'https://picsum.photos/seed/fruit/600/450', 'Fresh produce', 12),
('Spice Box (7 masalas)', 'Steel box with turmeric, chilli, coriander, cumin, mustard, garam masala and hing.', 340.00, 'https://picsum.photos/seed/spices/600/450', 'Grocery', 20),
('Whole Wheat Atta 10 kg', 'Stone-ground whole wheat flour.', 430.00, 'https://picsum.photos/seed/atta/600/450', 'Grocery', 30),
('Hand-made Soap (pack of 3)', 'Neem and tulsi soap bars, made locally.', 150.00, 'https://picsum.photos/seed/soap/600/450', 'Household', 35),
('Steel Water Bottle 1 L', 'Insulated, keeps water cold for 12 hours.', 399.00, 'https://picsum.photos/seed/bottle/600/450', 'Household', 18);
