const db = require('../db.js');

class CurrencyController {
    async getCurrencies(req, res) {
        try {
            const currencies = await db.query('SELECT * FROM "currencyType"');
            res.status(200).json(currencies.rows);
        } catch (error) {
            console.error('Error fetching currencies:', error);
            res.status(500).json({ message: 'Failed to fetch currencies' });
        }
    }
}

module.exports = new CurrencyController();