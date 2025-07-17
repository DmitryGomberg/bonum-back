const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const userRouter = require('./routes/user.controller');
const accountRouter = require('./routes/accounts.controller');
const currencyRouter = require('./routes/currency.controller');
const categoriesRouter = require('./routes/categories.controller');
const transactionsRouter = require('./routes/transactions.controller');
const PORT = process.env.PORT || 8080;

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'https://dmitrygomberg.github.io'],// URL клиента
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("Hello world");
});

app.use('/api', userRouter);
app.use('/api', accountRouter);
app.use('/api', currencyRouter);
app.use('/api', categoriesRouter);
app.use('/api', transactionsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
