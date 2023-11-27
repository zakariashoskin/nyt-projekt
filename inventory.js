const express = require('express');
const router = express.Router();
const { db, decrypt } = require('./database');

// API endpoint til at hente inventory
router.get('/', (req, res) => {
  db.all('SELECT * FROM inventory', [], (err, rows) => {
      if (err) {
          console.error('Database fejl:', err.message);
          res.status(500).json({ error: err.message });
          return;
      }


    const inventory = rows.map(row => ({
      id: row.id,
      item: decrypt({ iv: row.iv, content: row.item }),
      quantity: row.quantity
    }));
    res.json(inventory);
  });
});

// API endpoint til at opdatere inventory
router.post('/update', (req, res) => {
    const { item, quantity } = req.body;
    db.run('UPDATE inventory SET quantity = quantity - ? WHERE item = ?', [quantity, item], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Inventory opdateret', item: item, quantity: quantity });
    });
  });
  

// Funktion til at håndtere salg af en menuvare
const handleItemSale = (io, menuItemId) => {
  // Her skal du implementere logikken for at finde varen, opdatere lageret og sende svar tilbage til klienten
  db.get('SELECT ingredient1, quantity1, ingredient2, quantity2, ingredient3, quantity3 FROM menu WHERE id = ?', [menuItemId], (err, item) => {
      if (err) {
          console.error(err.message);
          return;
      }
      // Antag at hver ingrediens reducerer lageret med 1
      const updates = [
          { ingredient: item.ingredient1, amount: item.quantity1 },
          { ingredient: item.ingredient2, amount: item.quantity2 },
          { ingredient: item.ingredient3, amount: item.quantity3 },
      ];

      updates.forEach(update => {
          db.run('UPDATE inventory SET quantity = quantity - ? WHERE item = ?', [update.amount, update.ingredient], function(updateErr) {
              if (updateErr) {
                  console.error(updateErr.message);
                  return;
              }
              io.emit('inventory_update', { ingredient: update.ingredient, newQuantity: this.changes });
          });
      });
  });
};

router.handleItemSale = handleItemSale;
module.exports = router;
