const Router = require('express')
const currencyController = require("../controllers/currency.controller");
const router = new Router()

// модуль для получения валют
router.get('/currencies', currencyController.getCurrencies)

module.exports = router