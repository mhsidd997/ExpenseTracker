let expenseChart;

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    showDashboard();
  } else {
    alert(data.msg);
    document.getElementById('registerUsername').value = "";
    document.getElementById('registerPassword').value = "";
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    showDashboard();
  } else {
    alert(data.msg);
    document.getElementById('loginUsername').value = "";
    document.getElementById('loginPassword').value = "";
  }
});

document.getElementById('expenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const category = document.getElementById('category').value;
  const amount = document.getElementById('amount').value;
  const date = document.getElementById('date').value;
  const description = document.getElementById('description').value;

  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ category, amount, date, description })
  });

  const data = await res.json();
  if (res.ok) {
    alert('Expense added successfully');
    fetchExpenses();
    updateChart();
  } else {
    alert(data.msg);
  }
});

document.getElementById('generateReport').addEventListener('click', async () => {
    const res = await fetch('/api/expenses/report', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await res.json();
    
    if (data.length === 0) {
      alert('No data found to generate report');
      return;
    }
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data.excelReportData.map(item => ({
      Category: item._id,
      Total_Amount: item.amount
    })));
  
    XLSX.utils.book_append_sheet(wb, ws, "Report");
  
    XLSX.writeFile(wb, 'Expense_Report.xlsx');
  });

document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  document.getElementById('auth').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('registerUsername').value = "";
  document.getElementById('registerPassword').value = "";
  document.getElementById('loginUsername').value = "";
  document.getElementById('loginPassword').value = "";
});

function showDashboard() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  fetchExpenses();
  updateChart();
}

async function fetchExpenses() {
    const res = await fetch('/api/expenses', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  
    const data = await res.json();
    const expensesDiv = document.getElementById('expenses');
    expensesDiv.innerHTML = '';
    data.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString();
      const div = document.createElement('div');
      div.innerText = `Category: ${expense.category}, Amount: ${expense.amount}, Date: ${date}, Description: ${expense.description}`;
      expensesDiv.appendChild(div);
    });
  }

async function updateChart() {
  const res = await fetch('/api/expenses', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  const data = await res.json();
  const categoryTotals = data.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const categories = Object.keys(categoryTotals);
  const amounts = Object.values(categoryTotals);

  const ctx = document.getElementById('expenseChart').getContext('2d');
  
  // Destroy the previous chart instance if it exists
  if (expenseChart) {
    expenseChart.destroy();
  }

  // Create a new chart instance
  expenseChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [{
        data: amounts,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
      }]
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Expense Distribution by Category'
      }
    }
  });
}

window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  if (token) {
    showDashboard();
  }
});