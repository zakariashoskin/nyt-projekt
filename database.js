const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Database og krypteringskonfiguration
const db = new sqlite3.Database('storage.db');
const algorithm = 'aes-256-cbc'; 
const secretKey = Buffer.from('a72149ed2f6936a76380f8f38efc6cdbff0b6a41f6f72815fc867d2aaefb2cd4', 'hex'); // Brug en sikker nøgle

// Krypterings- og dekrypteringsfunktioner
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return { iv: iv.toString('hex'), content: encrypted.toString('hex') };
};

const decrypt = (hash) => {
    const iv = Buffer.from(hash.iv, 'hex');
    const encryptedText = Buffer.from(hash.content, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    
    let decrypted;
    try {
      const decryptedUpdate = decipher.update(encryptedText);
      const decryptedFinal = decipher.final();
      decrypted = Buffer.concat([decryptedUpdate, decryptedFinal]);
      
      console.log('Decrypted update:', decryptedUpdate.toString());
      console.log('Decrypted final:', decryptedFinal.toString());
      console.log('Decrypted full:', decrypted.toString());
    } catch (err) {
      console.error('Dekrypteringsfejl:', err);
      return null;
    }
    
    try {
      return decrypted.toString('utf8');
    } catch (err) {
      console.error('Encoding fejl efter dekryptering:', err);
      return null;
    }
  };
  

// Initialiserer databasen og indsætter startdata
const initializeDatabase = () => {
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY, item TEXT, quantity INTEGER, iv TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS menu (id INTEGER PRIMARY KEY, item TEXT, ingredients TEXT, item_iv TEXT, ingredients_iv TEXT)', () => {
      // Indsættelse af data i inventory og menu
      insertInitialData();
    });
  });
};


const insertInitialData = () => {
  const inventoryItems = [
    
        { item: "coffee beans", quantity: 1000 },
        { item: "whole milk", quantity: 100 },
        { item: "oat milk", quantity: 100 },
        { item: "water", quantity: 100 },
        { item: "oranges", quantity: 100 },
        { item: "apples", quantity: 100 },
        { item: "strawberries", quantity: 100 },
        { item: "blueberries", quantity: 100 },
        { item: "watermelon", quantity: 100 },
        { item: "pineapples", quantity: 100 },
        { item: "lemons", quantity: 100 },
        { item: "caramel", quantity: 100 },
        { item: "chocolate syrup", quantity: 100 },
        { item: "ice", quantity: 100 },
        { item: "vanilla ice cream", quantity: 100 },
        { item: "cup", quantity: 100 }
      
  ];

  const menuItems = [
    // Definer menu items her
     // Coffee Options
     { item: "Caffe Latte", ingredient1: "coffee beans", quantity1: 10, ingredient2: "whole milk", quantity2: 3, ingredient3: "cup", quantity3: 1 },
     { item: "Espresso", ingredient1: "coffee beans", quantity1: 7, ingredient2: "water", quantity2: 1, ingredient3: "cup", quantity3: 1 },
     { item: "Cappuccino", ingredient1: "coffee beans", quantity1: 8, ingredient2: "whole milk", quantity2: 3, ingredient3: "cup", quantity3: 1 },
     { item: "Mocha", ingredient1: "coffee beans", quantity1: 9, ingredient2: "chocolate syrup", quantity2: 2, ingredient3: "cup", quantity3: 1 },
     { item: "Americano", ingredient1: "coffee beans", quantity1: 6, ingredient2: "water", quantity2: 4, ingredient3: "cup", quantity3: 1 },
     { item: "Macchiato", ingredient1: "coffee beans", quantity1: 8, ingredient2: "caramel", quantity2: 2, ingredient3: "cup", quantity3: 1 },
     { item: "Affogato", ingredient1: "coffee beans", quantity1: 7, ingredient2: "vanilla ice cream", quantity2: 1, ingredient3: "cup", quantity3: 1 },
     { item: "Iced Coffee", ingredient1: "coffee beans", quantity1: 12, ingredient2: "ice", quantity2: 6, ingredient3: "cup", quantity3: 1 },

     // Juice Options
     { item: "Orange Juice", ingredient1: "oranges", quantity1: 3, ingredient2: "water", quantity2: 1, ingredient3: "cup", quantity3: 1 },
     { item: "Apple Juice", ingredient1: "apples", quantity1: 2, ingredient2: "water", quantity2: 1, ingredient3: "cup", quantity3: 1 },
     { item: "Strawberry Smoothie", ingredient1: "strawberries", quantity1: 5, ingredient2: "whole milk", quantity2: 2, ingredient3: "cup", quantity3: 1 },
     { item: "Blueberry Smoothie", ingredient1: "blueberries", quantity1: 4, ingredient2: "whole milk", quantity2: 2, ingredient3: "cup", quantity3: 1 },
     { item: "Mixed Berry Juice", ingredient1: "blueberries", quantity1: 2, ingredient2: "water", quantity2: 2, ingredient3: "cup", quantity3: 1 },
     { item: "Pineapple Juice", ingredient1: "pineapples", quantity1: 3, ingredient2: "water", quantity2: 1, ingredient3: "cup", quantity3: 1 },
     { item: "Watermelon Juice", ingredient1: "watermelons", quantity1: 4, ingredient2: "water", quantity2: 2, ingredient3: "cup", quantity3: 1 },
     { item: "Lemonade", ingredient1: "lemons", quantity1: 4, ingredient2: "water", quantity2: 2, ingredient3: "cup", quantity3: 1 }
  ];

  // Indsæt inventory data
  const inventoryStmt = db.prepare('INSERT OR IGNORE INTO inventory (item, quantity, iv) VALUES (?, ?, ?)');
  inventoryItems.forEach(item => {
    const encryptedItem = encrypt(item.item);
    inventoryStmt.run(encryptedItem.content, item.quantity, encryptedItem.iv);
  });
  inventoryStmt.finalize();

  // Indsæt menu data
  // Tilpasning af insertInitialData funktionen til at gemme en unik IV for både item og ingredients
const menuStmt = db.prepare('INSERT OR IGNORE INTO menu (item, ingredients, item_iv, ingredients_iv) VALUES (?, ?, ?, ?)');
menuItems.forEach(item => {
  const encryptedItem = encrypt(item.item);
  const encryptedIngredients = encrypt(JSON.stringify({
    ingredient1: item.ingredient1, quantity1: item.quantity1,
      ingredient2: item.ingredient2, quantity2: item.quantity2,
      ingredient3: item.ingredient3, quantity3: item.quantity3
    }));
    menuStmt.run(encryptedItem.content, encryptedIngredients.content, encryptedItem.iv, encryptedIngredients.iv);
});
  menuStmt.finalize();
};

module.exports = { db, encrypt, decrypt, initializeDatabase };


