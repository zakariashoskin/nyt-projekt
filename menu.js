const express = require('express');
const router = express.Router();
const { db, decrypt } = require('./database');


// GET route for '/menu'
router.get('/', (req, res) => {
    db.all('SELECT id, item, ingredients, item_iv, ingredients_iv FROM menu', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Der skete en serverfejl." });
        }

        // Brug map for at transformere rækkerne og filtrer derefter null-værdier væk
        const menu = rows.map(row => {
            let decryptedItem, decryptedIngredients;
            try {
                decryptedItem = decrypt({ iv: row.item_iv, content: row.item });
                decryptedIngredients = decrypt({ iv: row.ingredients_iv, content: row.ingredients });

                if (decryptedIngredients === null) {
                    // Log fejlen og spring over denne iteration
                    console.error('Dekrypteringsfejl for ingredienser');
                    return null;
                }

                // Parse decryptedIngredients som JSON
                const ingredients = JSON.parse(decryptedIngredients);

                // Retur objektet til det endelige array
                return {
                    id: row.id,
                    item: decryptedItem,
                    ingredients: ingredients
                };
            } catch (e) {
                // Log og håndter JSON parse fejl
                console.error('JSON Parse fejl:', e);
                return null;
            }
        }).filter(item => item !== null); // Fjern null-værdier fra resultatet

        // Send det endelige resultat som JSON
        if (!res.headersSent) {
            res.json(menu);
        }
    });
});

router.post('/sell', async (req, res) => {
    const { id } = req.body;
    let transactionActive = false;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "Ugyldig ID værdi." });
    }

    try {
        await db.run('BEGIN TRANSACTION');
        transactionActive = true;

        const row = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM menu WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error('Varen blev ikke fundet.'));
                } else {
                    resolve(row);
                }
            });
        });

        const ingredients = JSON.parse(decrypt({ iv: row.ingredients_iv, content: row.ingredients }));

        for (const key in ingredients) {
            if (ingredients.hasOwnProperty(key)) {
                const ingredientName = ingredients[key].ingredient;
                const amountToReduce = ingredients[key].quantity;

                await new Promise((resolve, reject) => {
                    db.run('UPDATE inventory SET quantity = quantity - ? WHERE item = ?', [amountToReduce, ingredientName], function(err) {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                });
            }
        }

        await db.run('COMMIT');
        transactionActive = false;

        if (!res.headersSent) {
            res.status(200).json({ message: 'Salg behandlet og lager opdateret' });
            io.emit('inventory_updated'); // Husk at io er defineret og tilgængelig
        }
    } catch (e) {
        if (transactionActive) {
            await db.run('ROLLBACK');
        }

        if (!res.headersSent) {
            if (e.message === 'Varen blev ikke fundet.') {
                res.status(404).json({ error: e.message });
            } else {
                res.status(500).json({ error: "Serverfejl under opdatering af databasen." });
            }
        }
    }
});




module.exports = router;
