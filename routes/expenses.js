const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  const { category, amount, date, description } = req.body;
  try {
    const newExpense = new Expense({ userId: req.user.userId, category, amount, date, description });
    const expense = await newExpense.save();
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/', auth, async (req, res) => {
  const filter = { userId: req.user.userId };
  console.log("get: " , filter.userId);
  try {
    const expenses = await Expense.find(filter);
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/report', auth, async (req, res) => {
  try {
    const userExpenses = await Expense.find({ userId: req.user.userId });

    const aggregatedExpenses = userExpenses.reduce((acc, expense) => {
      const category = expense.category;
      const amount = expense.amount;

      if (!acc[category]) {
        acc[category] = { _id: category, totalAmount: 0 };
      }
      acc[category].totalAmount += amount;

      return acc;
    }, {});

    const expensesArray = Object.values(aggregatedExpenses);

    const excelReportData = expensesArray.map(expense => ({
      _id: expense._id,
      amount: expense.totalAmount
    }));

    res.json({excelReportData});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;