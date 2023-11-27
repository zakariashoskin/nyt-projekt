document.addEventListener('DOMContentLoaded', () => {
    // Opret forbindelse til Socket.IO serveren
    var socket = io();

    // Lyt efter 'inventory_updated' begivenheden fra serveren
    socket.on('inventory_updated', () => {
        updateInventoryUI(); // Opdater lager UI når en 'inventory_updated' begivenhed modtages
    });


    window.sellMenuItem = function(menuItemId) {
      socket.emit('sell_item', menuItemId);
    };


  // Hent menu data
  fetch('/menu')
      .then(response => response.json())
      .then(menuItems => {
          const menuDiv = document.getElementById('menu');
          menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            // Brug JSON.stringify til at konvertere ingredienserne til en streng
            const ingredientsStr = JSON.stringify(item.ingredients, null, 2); // Formateret med indrykning for læsbarhed
            menuItem.innerHTML = `<h3>${item.item}</h3><pre>${ingredientsStr}</pre><button onclick="sellMenuItem(${item.id})">Sælg Vare</button>`;
            menuDiv.appendChild(menuItem);
        });
      });

  // Hent lager data
  fetch('/inventory')
      .then(response => response.json())
      .then(inventoryItems => {
          const inventoryDiv = document.getElementById('inventory');
          inventoryItems.forEach(item => {
              const inventoryItem = document.createElement('div');
              inventoryItem.innerHTML = `<h3>${item.item}</h3><p>Mængde: ${item.quantity}</p>`;
              inventoryDiv.appendChild(inventoryItem);
          });
      });

  // Funktion til at håndtere salg af en menuvare
// Funktion til at håndtere salg af en menuvare
window.sellMenuItem = function(menuItemId) {
    fetch('/menu/sell', { // Corrected URL
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: menuItemId }) // Ensure correct body data is sent
})
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json(); // Her bør du håndtere ikke-JSON svaret korrekt
    })
    .then(data => {
        console.log(data.message);
        updateInventoryUI(); // Opdater UI efter salg
        // Opdater UI baseret på svaret
        // Du kan f.eks. opdatere lagerbeholdningen her
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Der opstod en fejl under salgsprocessen. Prøv venligst igen.'); // Vis en fejlmeddelelse til brugeren
    });
};
});


// Funktion til at opdatere lagerbeholdningen i UI
function updateInventoryUI() {
    fetch('/inventory')
        .then(response => response.json())
        .then(inventoryItems => {
            const inventoryDiv = document.getElementById('inventory');
            // Fjern gamle lageroplysninger
            inventoryDiv.innerHTML = '';
            // Tilføj opdaterede lageroplysninger
            inventoryItems.forEach(item => {
                const inventoryItem = document.createElement('div');
                inventoryItem.innerHTML = `<h3>${item.item}</h3><p>Mængde: ${item.quantity}</p>`;
                inventoryDiv.appendChild(inventoryItem);
            });
        });
}
