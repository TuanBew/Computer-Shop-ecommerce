
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });


const MONGODB_URI = process.env.MONGODB_URI || process.env.CONNECT_DB || 'mongodb://mongo:27017/computer-shop';

const usersData = [
  {
    "_id": "6829644962994377b25e9c7c",
    "fullName": "Admin User",
    "email": "admin@computershop.com",
    "password": "$2b$10$6xpWOwQwZmyZ9WMGk3mSquhXZ1f0CeO1z4OLZzmWL263P4NtJClrG",
    "isAdmin": true,
    "isActive": true,
    "typeLogin": "local",
    "phone": "0123456789",
    "createdAt": new Date("2025-05-18T04:38:33.334Z"),
    "updatedAt": new Date("2025-05-18T04:38:33.334Z")
  },
  {
    "_id": "6829cce3a864d785ef0a8a9d",
    "fullName": "Tuan Anh Le Nguyen",
    "email": "tuananhlenguyen9@gmail.com",
    "isAdmin": false,
    "isActive": false,
    "typeLogin": "google",
    "createdAt": new Date("2025-05-18T12:04:51.011Z"),
    "updatedAt": new Date("2025-05-18T12:04:51.011Z"),
    "__v": 0
  }
];

const productsData = [
  {
    "_id": "6829ca52a864d785ef0a8a15",
    "name": "Laptop ASUS ROG Zephyrus G16 GU605CR-QR137W",
    "price": 85000000,
    "priceDiscount": 10000000,
    "images": [
      "http://localhost:3000/uploads/images/1747569261316.webp"
    ],
    "stock": 89999,
    "cpu": "Intel Core Ultra 9 285H 2.9 GHz (24MB Cache, up to 5.4 GHz, 16 lõi, 16 luồng)",
    "screen": "16 inches ",
    "gpu": "NVIDIA GeForce RTX 5070 Ti 12GB GDDR7 ROG Boost: 1497MHz* ở 115W (Xung nhịp tăng cường 1447MHz+OC 50MHz, Tăng cường động 95W+20W) Intel Arc Graphics",
    "storage": "1TB PCIe 4.0 NVMe M.2 SSD (2 Khe cắm M.2 hỗ trợ SATA hoặc NVMe, tối đa 2TB)",
    "screenHz": " 240 Hz Độ sáng 500 nits (Peak) Độ phủ màu DCI-P3 100% Màn hình bóng G-Sync ROG Nebula Display Dolby Vision HDR",
    "ram": "32GB DDR6",
    "battery": " 90WHrs, 4S1P, 4-cell Li-ion Sạc lại từ 0-50% trong 30 phút",
    "camera": "Camera IR FHD 1080P cho Windows Hello",
    "weight": "35.4 x 24.6 x 1.49 ~ 1.74 cm (Dài x Rộng X Dày) 1.95 Kg",
    "createdAt": new Date("2025-05-18T11:53:54.623Z"),
    "updatedAt": new Date("2025-05-18T11:54:33.139Z"),
    "__v": 0
  },
  {
    "_id": "6829cb82a864d785ef0a8a6c",
    "name": "MacBook Pro 16 M4 Max 16CPU 40GPU 64GB 2TB | Chính hãng Apple Việt Nam",
    "price": 116999000,
    "priceDiscount": 100000000,
    "images": [
      "http://localhost:3000/uploads/images/1747569538437.webp"
    ],
    "stock": 4999998,
    "cpu": " Apple M4 Max 16 lõi với 12 lõi hiệu năng và 4 lõi tiết kiệm điện",
    "screen": "16.2 inches",
    "gpu": " 40 lõi Neural Engine 16 lõi",
    "storage": " 2TB",
    "screenHz": " 120Hz Màn hình Liquid Retina XDR XDR (Extreme Dynamic Range) Độ sáng XDR: 1.000 nit ở chế độ toàn màn hình, độ sáng đỉnh 1.600 nit (chỉ nội dung HDR) 1 tỷ màu Dải màu rộng (P3) Công nghệ True Tone Hỗ trợ tối đa bốn màn hình ngoài",
    "ram": "64GB",
    "battery": "Pin Li-Po 100 watt-giờ Thời gian xem video trực tuyến lên đến 21 giờ Thời gian duyệt web trên mạng không dây lên đến 14 giờ",
    "camera": "Camera 12MP Center Stage có hỗ trợ chế độ Desk View Quay video HD 1080p Bộ xử lý tín hiệu hình ảnh tiên tiến với video điện toán",
    "weight": "2.15 kg",
    "createdAt": new Date("2025-05-18T11:58:58.456Z"),
    "updatedAt": new Date("2025-05-18T12:07:10.084Z"),
    "__v": 0
  }
];

const reviewsData = [];
const paymentsData = [
  {
    "_id": "6829ca8da864d785ef0a8a3f",
    "userId": "6829644962994377b25e9c7c",
    "products": [
      {
        "productId": "6829ca52a864d785ef0a8a15",
        "quantity": 1,
        "_id": "6829ca79a864d785ef0a8a2c"
      }
    ],
    "fullName": "tuan anh",
    "phone": 869051659,
    "address": "cao thi chinh",
    "typePayments": "COD",
    "statusOrder": "completed",
    "totalPrice": 85000000,
    "createdAt": new Date("2025-05-18T11:54:53.226Z"),
    "updatedAt": new Date("2025-05-18T11:55:09.126Z"),
    "__v": 0
  },
  {
    "_id": "6829cd7aa864d785ef0a8ac6",
    "userId": "6829cce3a864d785ef0a8a9d",
    "products": [
      {
        "productId": "6829cb82a864d785ef0a8a6c",
        "quantity": 1,
        "_id": "6829cd6ea864d785ef0a8ab3"
      }
    ],
    "fullName": "tuan anh",
    "phone": 869051659,
    "address": "cao thi chinh",
    "typePayments": "COD",
    "statusOrder": "pending",
    "totalPrice": 116999000,
    "createdAt": new Date("2025-05-18T12:07:22.104Z"),
    "updatedAt": new Date("2025-05-18T12:07:22.104Z"),
    "__v": 0
  }
];

const otpsData = [];

const categoriesData = [];
const ordersData = [];
const cartsData = [];
const apikeysData = [];

const collections = [
  { name: 'users', data: usersData },
  { name: 'products', data: productsData },
  { name: 'reviews', data: reviewsData },
  { name: 'payments', data: paymentsData },
  { name: 'otps', data: otpsData },
  { name: 'categories', data: categoriesData },
  { name: 'orders', data: ordersData },
  { name: 'carts', data: cartsData },
  { name: 'apikeys', data: apikeysData }
];

async function setupDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);

    const db = mongoose.connection.db;

    for (const collection of collections) {
      try {
        console.log(`Setting up collection: ${collection.name}`);

        const dbCollection = db.collection(collection.name);

        await dbCollection.deleteMany({});
        console.log(`Cleared collection: ${collection.name}`);

        if (collection.data.length === 0) {
          console.log(`No data for ${collection.name}. Creating empty collection.`);
          continue;
        }

        const documentsToInsert = collection.data.map(doc => {
          const newDoc = { ...doc };
          if (typeof newDoc._id === 'string') {
            newDoc._id = new mongoose.Types.ObjectId(newDoc._id);
          }

          if (newDoc.products && Array.isArray(newDoc.products)) {
            newDoc.products = newDoc.products.map(product => {
              const newProduct = { ...product };
              if (typeof newProduct._id === 'string') {
                newProduct._id = new mongoose.Types.ObjectId(newProduct._id);
              }
              return newProduct;
            });
          }
          
          return newDoc;
        });

        const result = await dbCollection.insertMany(documentsToInsert);
        console.log(`Imported ${result.insertedCount} documents into ${collection.name}`);
      } catch (error) {
        console.error(`Error processing ${collection.name}:`, error);
      }
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

setupDatabase().catch(error => {
  console.error('Failed to set up database:', error);
  process.exit(1);
});