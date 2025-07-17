const Router = require('express')
const accountsController = require("../controllers/accounts.controller");
const router = new Router()


// модуль для добавления счета
router.post('/accounts', accountsController.addUserAccount)

// модуль для редактирования счета
router.post('/accounts/edit', accountsController.editUserAccount)

// модуль для удаления счета
router.post('/accounts/delete', accountsController.deleteUserAccount)

// модуль для получения всех счетов пользователя
router.get('/accounts', accountsController.getUserAccounts)

module.exports = router