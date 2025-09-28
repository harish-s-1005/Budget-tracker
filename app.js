// Constants
const PASSWORD = "1005"; // change your password here!

// Elements
const loginScreen = document.getElementById("login-screen");
const appContainer = document.getElementById("app");
const loginBtn = document.getElementById("login-btn");
const loginPasswordInput = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const navButtons = document.querySelectorAll("nav button.nav-btn");
const sections = document.querySelectorAll(".section");

// Home elements
const entryForm = document.getElementById("entry-form");
const entriesTableBody = document.querySelector("#entries-table tbody");
const monthlySummaryDiv = document.getElementById("monthly-summary");

// Dashboard elements
const dashboardYear = document.getElementById("dashboard-year");
const dashboardMonth = document.getElementById("dashboard-month");
const dashboardCategory = document.getElementById("dashboard-category");
const dashboardRefreshBtn = document.getElementById("dashboard-refresh");
const categoryChartCtx = document.getElementById("category-chart").getContext("2d");
const incomeExpenseChartCtx = document.getElementById("income-expense-chart").getContext("2d");

// Statement elements
const statementYear = document.getElementById("statement-year");
const statementMonth = document.getElementById("statement-month");
const statementCategory = document.getElementById("statement-category");
const statementRefreshBtn = document.getElementById("statement-refresh");
const exportExcelBtn = document.getElementById("export-excel");
const exportCsvBtn = document.getElementById("export-csv");
const statementTableBody = document.querySelector("#statement-table tbody");

let data = [];
let currentUser = null;

let categoryChart, incomeExpenseChart;

// --------- UTILITIES -----------

function saveData() {
  localStorage.setItem("expenseTrackerData", JSON.stringify(data));
}

function loadData() {
  const stored = localStorage.getItem("expenseTrackerData");
  if (stored) {
    data = JSON.parse(stored);
  } else {
    data = [];
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function filterData(year, month, category) {
  return data.filter((entry) => {
    const date = new Date(entry.date);
    const matchesYear = year === "all" || date.getFullYear() === +year;
    const matchesMonth = month === "all" || date.getMonth() === +month;
    const matchesCategory = !category || category.trim() === "" || entry.category.toLowerCase() === category.trim().toLowerCase();
    return matchesYear && matchesMonth && matchesCategory;
  });
}

// --------- LOGIN LOGIC ------------

function showApp() {
  loginScreen.classList.add("hidden");
  appContainer.classList.remove("hidden");
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  appContainer.classList.add("hidden");
  loginPasswordInput.value = "";
  loginError.textContent = "";
}

loginBtn.addEventListener("click", () => {
  if (loginPasswordInput.value === PASSWORD) {
    showApp();
  } else {
    loginError.textContent = "Incorrect password!";
  }
});

logoutBtn.addEventListener("click", () => {
  showLogin();
});

// -------- NAVIGATION ------------

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;
    sections.forEach((sec) => {
      sec.classList.toggle("active", sec.id === target);
    });
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    if (target === "dashboard") {
      populateDashboardFilters();
      refreshDashboard();
    } else if (target === "statement") {
      populateStatementFilters();
      refreshStatement();
    } else if (target === "home") {
      renderEntriesTable();
      renderMonthlySummary();
    }
  });
});

// Default active nav on load:
navButtons[0].click();

// --------- ENTRY FORM -----------

entryForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value.trim();
  const date = document.getElementById("date").value;

  if (!date) {
    alert("Please select a date.");
    return;
  }

  if (!category) {
    alert("Please enter a category.");
    return;
  }

  if (amount <= 0) {
    alert("Amount must be greater than zero.");
    return;
  }

  const newEntry = {
    id: Date.now(),
    type,
    amount,
    category,
    date,
  };

  data.push(newEntry);
  saveData();
  entryForm.reset();
  renderEntriesTable();
  renderMonthlySummary();
});

// --------- ENTRIES TABLE ------------

function renderEntriesTable() {
  entriesTableBody.innerHTML = "";
  data
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.type}</td>
        <td>${entry.amount.toFixed(2)}</td>
        <td>${entry.category}</td>
        <td>${formatDate(entry.date)}</td>
        <td><button class="action-btn delete-btn" data-id="${entry.id}">Delete</button></td>
      `;
      entriesTableBody.appendChild(tr);
    });

  // Add delete event
  entriesTableBody.querySelectorAll("button.delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      data = data.filter((entry) => entry.id !== id);
      saveData();
      renderEntriesTable();
      renderMonthlySummary();
    });
  });
}

// --------- MONTHLY SUMMARY ------------

function renderMonthlySummary() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthEntries = data.filter((entry) => {
    const d = new Date(entry.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  let incomeSum = 0,
    expenseSum = 0;

  monthEntries.forEach((e) => {
    if (e.type === "income") incomeSum += e.amount;
    else if (e.type === "expense") expenseSum += e.amount;
  });

  monthlySummaryDiv.innerHTML = `
    <h3>Summary for ${now.toLocaleString("default", { month: "long" })} ${year}</h3>
    <p><strong>Income:</strong> $${incomeSum.toFixed(2)}</p>
    <p><strong>Expense:</strong> $${expenseSum.toFixed(2)}</p>
    <p><strong>Balance:</strong> $${(incomeSum - expenseSum).toFixed(2)}</p>
  `;
}

// -------- DASHBOARD ------------

function populateYearSelect(select) {
  select.innerHTML = "";
  const years = Array.from(
    new Set(data.map((d) => new Date(d.date).getFullYear()))
  ).sort();
  if (years.length === 0) {
    const thisYear = new Date().getFullYear();
    years.push(thisYear);
  }
  years.forEach((y) => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  });
}

function populateDashboardFilters() {
  populateYearSelect(dashboardYear);
  dashboardMonth.value = "all";
  dashboardCategory.value = "";
}

function refreshDashboard() {
  const year = dashboardYear.value || new Date().getFullYear();
  const month = dashboardMonth.value || "all";
  const category = dashboardCategory.value.trim();

  const filtered = filterData(year, month, category);

  // Group by category
  const categorySums = {};
  filtered.forEach((entry) => {
    if (!categorySums[entry.category]) categorySums[entry.category] = 0;
    if (entry.type === "expense") categorySums[entry.category] += entry.amount;
    else if (entry.type === "income") categorySums[entry.category] -= entry.amount; // Income as negative for visualization
  });

  const labels = Object.keys(categorySums);
  const values = labels.map((cat) => Math.abs(categorySums[cat]));

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(categoryChartCtx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: "Category Expenses",
          data: values,
          backgroundColor: [
            "#ff6384",
            "#36a2eb",
            "#cc65fe",
            "#ffce56",
            "#45c490",
            "#ffa07a",
          ],
        },
      ],
    },
  });

  // Income vs Expense chart
  let totalIncome = 0,
    totalExpense = 0;
  filtered.forEach((entry) => {
    if (entry.type === "income") totalIncome += entry.amount;
    else if (entry.type === "expense") totalExpense += entry.amount;
  });

  if (incomeExpenseChart) incomeExpenseChart.destroy();
  incomeExpenseChart = new Chart(incomeExpenseChartCtx, {
    type: "bar",
    data: {
      labels: ["Income", "Expense"],
      datasets: [
        {
          label: "Amount",
          data: [totalIncome, totalExpense],
          backgroundColor: ["#4caf50", "#f44336"],
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

dashboardRefreshBtn.addEventListener("click", () => {
  refreshDashboard();
});

// -------- STATEMENT ------------

function populateStatementFilters() {
  populateYearSelect(statementYear);
  statementMonth.value = "all";
  statementCategory.value = "";
}

function refreshStatement() {
  const year = statementYear.value || new Date().getFullYear();
  const month = statementMonth.value || "all";
  const category = statementCategory.value.trim();

  const filtered = filterData(year, month, category);

  statementTableBody.innerHTML = "";

  filtered
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.type}</td>
        <td>${entry.amount.toFixed(2)}</td>
        <td>${entry.category}</td>
        <td>${formatDate(entry.date)}</td>
      `;
      statementTableBody.appendChild(tr);
    });
}

statementRefreshBtn.addEventListener("click", () => {
  refreshStatement();
});

// -------- EXPORTS ------------

// Simple CSV Export
function exportCSV() {
  const year = statementYear.value || new Date().getFullYear();
  const month = statementMonth.value || "all";
  const category = statementCategory.value.trim();

  const filtered = filterData(year, month, category);

  if (filtered.length === 0) {
    alert("No data to export.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Type,Amount,Category,Date\n";

  filtered.forEach((entry) => {
    csvContent += `${entry.type},${entry.amount.toFixed(2)},${entry.category},${formatDate(entry.date)}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `expense_statement_${year}_${month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Basic Excel export using CSV format but .xls extension
function exportExcel() {
  const year = statementYear.value || new Date().getFullYear();
  const month = statementMonth.value || "all";
  const category = statementCategory.value.trim();

  const filtered = filterData(year, month, category);

  if (filtered.length === 0) {
    alert("No data to export.");
    return;
  }

  let excelContent = `<table><tr><th>Type</th><th>Amount</th><th>Category</th><th>Date</th></tr>`;

  filtered.forEach((entry) => {
    excelContent += `<tr><td>${entry.type}</td><td>${entry.amount.toFixed(2)}</td><td>${entry.category}</td><td>${formatDate(entry.date)}</td></tr>`;
  });

  excelContent += `</table>`;

  const uri = "data:application/vnd.ms-excel;base64,";
  const base64 = (s) => window.btoa(unescape(encodeURIComponent(s)));

  const link = document.createElement("a");
  link.href = uri + base64(excelContent);
  link.download = `expense_statement_${year}_${month}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

exportCsvBtn.addEventListener("click", exportCSV);
exportExcelBtn.addEventListener("click", exportExcel);

// -------- INIT ------------

function init() {
  loadData();
  renderEntriesTable();
  renderMonthlySummary();
}

init();
