const Router = require('express')
const router = new Router()
const userController = require('../controllers/user.controller')


router.post('/register', userController.registrUser);
router.get('/user',  userController.getUser) // получение всех пользователей
router.get('/user/:id',  userController.getOneUser) // получение одного пользователя
router.put('/user',  userController.updateUser) // обновление пользователя
router.put('/userInitials',  userController.updateUserInitials) // обновление инициалов пользователя
router.delete('/user/:id',  userController.deleteUser) // удаление пользователя
router.post('/login', userController.loginUser);
router.post('/api/token', userController.tokenUser);

router.post('/forgot-password', userController.sendPasswordResetEmail);
router.post('/reset-password', userController.resetPassword);


module.exports = router