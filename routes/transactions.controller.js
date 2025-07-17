const Router = require('express');
const router = new Router();
const transactionsController = require('../controllers/transactions.controller');

router.post('/addTransaction', transactionsController.createNew);
router.delete('/deleteTransaction/:id', transactionsController.deleteTransaction);
router.get('/transactions', transactionsController.getTransactions);

module.exports = router;