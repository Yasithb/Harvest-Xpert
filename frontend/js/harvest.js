document.addEventListener('DOMContentLoaded', () => {
    const harvestRecords = [
        { name: "John Doe", address: "123 Farm Lane", contact: "123-456-7890", username: "john123", harvestType: "Wheat", amount: 500, predictedPrice: 1500 },
        { name: "Jane Smith", address: "456 Orchard Road", contact: "987-654-3210", username: "jane_smith", harvestType: "Corn", amount: 300, predictedPrice: 900 },
        // Add more records as needed
    ];

    const harvestTableBody = document.getElementById('harvestTableBody');

    function renderTable(records) {
        harvestTableBody.innerHTML = '';
        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.name}</td>
                <td>${record.address}</td>
                <td>${record.contact}</td>
                <td>${record.username}</td>
                <td>${record.harvestType}</td>
                <td>${record.amount}</td>
                <td>${record.predictedPrice}</td>
            `;
            harvestTableBody.appendChild(row);
        });
    }

    document.getElementById('searchBar').addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredRecords = harvestRecords.filter(record => {
            return Object.values(record).some(value =>
                value.toString().toLowerCase().includes(searchTerm)
            );
        });
        renderTable(filteredRecords);
    });

    renderTable(harvestRecords);
});
