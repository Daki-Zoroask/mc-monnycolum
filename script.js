let currentYear = 2026;
let currentMonth = new Array(0).concat(new Date().getMonth())[0];

const MIN_MONTH = 5; // มิ.ย. 2026
const MAX_MONTH = 11; // ธ.ค. 2026
if (currentMonth < MIN_MONTH) currentMonth = MIN_MONTH;

let financialData = JSON.parse(localStorage.getItem('MC_FinancialData')) || {};
let goalsData = JSON.parse(localStorage.getItem('MC_GoalsData')) || [];

const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const calendarDays = document.getElementById('calendarDays');
const currentMonthYearText = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const recordModal = document.getElementById('recordModal');
const financialForm = document.getElementById('financialForm');
let selectedDateStr = "";
let editingGoalId = null;

// ระบบควบคุมเปลี่ยนแถบเมนูหน้าจอ
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page-content');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        document.getElementById(item.getAttribute('data-target')).classList.add('active');

        if (item.getAttribute('data-target') === 'page-stats') initStatsDefaultDates();
        if (item.getAttribute('data-target') === 'page-goals') renderGoalsPage();
    });
});

function updateThemeByTime() {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 18) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', 'dark');
}
updateThemeByTime(); setInterval(updateThemeByTime, 60000);

function closeElement(id) { document.getElementById(id).style.display = 'none'; }

function getPreviousBalance(dateStr) {
    const allDates = Object.keys(financialData).sort();
    let lastDate = null;
    for (let i = allDates.length - 1; i >= 0; i--) {
        if (allDates[i] < dateStr) { lastDate = allDates[i]; break; }
    }
    return lastDate ? (financialData[lastDate].postBalance || 0) : 0;
}

function getTotalSavingsPool() {
    const allDates = Object.keys(financialData).sort();
    return allDates.length > 0 ? (financialData[allDates[allDates.length - 1]].postBalance || 0) : 0;
}

// แผงปฏิทินหน้าหลัก
function renderCalendar() {
    currentMonthYearText.innerText = `${monthNames[currentMonth]} ${currentYear}`;
    calendarDays.innerHTML = "";
    prevMonthBtn.style.visibility = (currentMonth <= MIN_MONTH) ? 'hidden' : 'visible';
    nextMonthBtn.style.visibility = (currentMonth >= MAX_MONTH) ? 'hidden' : 'visible';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div'); empty.classList.add('day-cell', 'empty');
        calendarDays.appendChild(empty);
    }

    let monthInc = 0; let monthExp = 0;
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div'); cell.classList.add('day-cell');
        const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dData = financialData[dStr] || { income: 0, expense: 0, time: '' };

        monthInc += Number(dData.income || 0); monthExp += Number(dData.expense || 0);

        cell.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="day-num">${day}</span>
                ${dData.time ? `<span style="font-size: 0.55rem; opacity: 0.5;">⏱️${dData.time.substring(0, 5)}</span>` : ''}
            </div>
            <div class="day-info">
                ${dData.income ? `<span class="text-success">+${dData.income}</span><br>` : ''}
                ${dData.expense ? `<span class="text-danger">-${dData.expense}</span>` : ''}
            </div>
        `;
        cell.addEventListener('click', () => {
            selectedDateStr = dStr;
            document.getElementById('modalTitle').innerText = `บันทึกการเงินวันที่ ${day} ${monthNames[currentMonth]} ${currentYear}`;
            document.getElementById('modalTime').innerText = `เวลาบันทึกอัตโนมัติ: ${new Date().toTimeString().split(' ')[0]}`;
            document.getElementById('prevBalance').value = getPreviousBalance(dStr);
            document.getElementById('incomeInput').value = dData.income || '';
            document.getElementById('expenseInput').value = dData.expense || '';
            document.getElementById('detailInput').value = dData.detail || '';
            calculateForm(); recordModal.style.display = 'flex';
        });
        calendarDays.appendChild(cell);
    }
    document.getElementById('totalMonthIncome').innerText = monthInc.toFixed(2);
    document.getElementById('totalMonthExpense').innerText = monthExp.toFixed(2);
    document.getElementById('totalMonthBalance').innerText = (monthInc - monthExp).toFixed(2);
}

function calculateForm() {
    const pB = Number(document.getElementById('prevBalance').value) || 0;
    const i = Number(document.getElementById('incomeInput').value) || 0;
    const e = Number(document.getElementById('expenseInput').value) || 0;
    document.getElementById('dayNet').innerText = (i - e).toFixed(2);
    document.getElementById('postBalance').innerText = (pB + (i - e)).toFixed(2);
}
document.getElementById('incomeInput').addEventListener('input', calculateForm);
document.getElementById('expenseInput').addEventListener('input', calculateForm);

financialForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const i = Number(document.getElementById('incomeInput').value) || 0;
    const exp = Number(document.getElementById('expenseInput').value) || 0;
    const pB = Number(document.getElementById('prevBalance').value) || 0;

    financialData[selectedDateStr] = {
        time: new Date().toTimeString().split(' ')[0],
        prevBalance: pB, income: i, expense: exp,
        detail: document.getElementById('detailInput').value,
        net: i - exp, postBalance: pB + (i - exp)
    };
    localStorage.setItem('MC_FinancialData', JSON.stringify(financialData));
    recordModal.style.display = 'none'; renderCalendar();
});

prevMonthBtn.addEventListener('click', () => { if (currentMonth > MIN_MONTH) { currentMonth--; renderCalendar(); } });
nextMonthBtn.addEventListener('click', () => { if (currentMonth < MAX_MONTH) { currentMonth++; renderCalendar(); } });


// --- ระบบจัดการหน้าสถิติแบบระบุช่วงวัน ---
let currentFilter = 'month';
const filterButtons = document.querySelectorAll('.filter-btn');
const startDateInput = document.getElementById('statStartDate');
const endDateInput = document.getElementById('statEndDate');

// ตั้งค่า Default ลงในกล่องวันที่เมื่อสลับปุ่ม
function initStatsDefaultDates() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (currentFilter === 'day') {
        startDateInput.value = todayStr;
        endDateInput.value = todayStr;
    } else if (currentFilter === 'week') {
        const first = today.getDate() - today.getDay(); 
        const last = first + 6;
        startDateInput.value = new Date(today.setDate(first)).toISOString().split('T')[0];
        endDateInput.value = new Date(today.setDate(last)).toISOString().split('T')[0];
    } else if (currentFilter === 'month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        startDateInput.value = firstDay.toISOString().split('T')[0];
        endDateInput.value = lastDay.toISOString().split('T')[0];
    }
    renderStatsPage();
}

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const filterVal = btn.getAttribute('data-filter');
        if (filterVal === 'year') { alert('ระบบรายปียังไม่เปิดใช้งานในเวอร์ชันนี้ครับ'); return; }
        
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = filterVal;
        initStatsDefaultDates();
    });
});

// ดักจับเมื่อผู้ใช้เปลี่ยนวันที่ในช่อง Input เอง
startDateInput.addEventListener('change', renderStatsPage);
endDateInput.addEventListener('change', renderStatsPage);

function renderStatsPage() {
    const start = startDateInput.value;
    const end = endDateInput.value;

    if (!start || !end) return;

    const allDates = Object.keys(financialData).sort();
    let filterIncome = 0; let filterExpense = 0;
    const tableBody = document.getElementById('statTableBody');
    tableBody.innerHTML = "";

    allDates.forEach(date => {
        // เงื่อนไขคัดกรอง: ตรวจสอบว่าวันที่อยู่ในช่วง Start และ End หรือไม่
        if (date >= start && date <= end) {
            const rowData = financialData[date];
            filterIncome += Number(rowData.income || 0);
            filterExpense += Number(rowData.expense || 0);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date} <span class="time-label">${rowData.time}</span></td>
                <td class="text-success">+${rowData.income}</td>
                <td class="text-danger">-${rowData.expense}</td>
                <td class="text-primary">${rowData.postBalance}</td>
            `;
            tableBody.appendChild(row);
        }
    });

    document.getElementById('circleIncomeText').innerText = filterIncome.toFixed(0);
    document.getElementById('circleExpenseText').innerText = filterExpense.toFixed(0);

    const circumference = 534;
    const ringIncome = document.getElementById('ringIncome');
    const ringExpense = document.getElementById('ringExpense');
    const totalAmount = filterIncome + filterExpense;
    
    if (totalAmount === 0) {
        ringIncome.style.strokeDasharray = `0 ${circumference}`;
        ringExpense.style.strokeDasharray = `0 ${circumference}`;
    } else {
        const incomeDash = circumference * (filterIncome / totalAmount);
        const expenseDash = circumference * (filterExpense / totalAmount);
        ringIncome.style.strokeDasharray = `${incomeDash} ${circumference}`;
        ringExpense.style.strokeDasharray = `${expenseDash} ${circumference}`;
        ringExpense.style.strokeDashoffset = `-${incomeDash}`;
    }
}


// --- 4. ระบบเป้าหมาย ---
document.getElementById('createGoalBtn').addEventListener('click', () => {
    const name = document.getElementById('goalNameInput').value.trim();
    const target = Number(document.getElementById('goalTargetInput').value) || 0;
    const note = document.getElementById('goalNoteInput').value.trim();

    if(!name || target <= 0) { alert('กรุณากรอกข้อมูลให้ครบถ้วน!'); return; }

    const newGoal = {
        id: Date.now(), name: name, target: target, note: note,
        dateStr: new Date().toLocaleDateString('th-TH'),
        timeStr: new Date().toTimeString().split(' ')[0], status: 'active'
    };
    goalsData.push(newGoal); saveGoalsToStorage();
    document.getElementById('goalNameInput').value = "";
    document.getElementById('goalTargetInput').value = "";
    document.getElementById('goalNoteInput').value = "";
    renderGoalsPage();
});

function saveGoalsToStorage() { localStorage.setItem('MC_GoalsData', JSON.stringify(goalsData)); }
document.getElementById('goalSortSelect').addEventListener('change', renderGoalsPage);

function renderGoalsPage() {
    const activeList = document.getElementById('activeGoalsList');
    const historyList = document.getElementById('historyGoalsList');
    activeList.innerHTML = ""; historyList.innerHTML = "";

    const totalSavingsPool = getTotalSavingsPool();
    const sortBy = document.getElementById('goalSortSelect').value;

    let actives = goalsData.filter(g => g.status === 'active');
    let histories = goalsData.filter(g => g.status === 'completed' || g.status === 'cancelled');

    const sortingLogic = (a, b) => {
        if (sortBy === 'time') return b.id - a.id;
        if (sortBy === 'date') return new Date(b.id) - new Date(a.id);
        if (sortBy === 'amount') return b.target - a.target;
        if (sortBy === 'progress') return ((totalSavingsPool/b.target)*100) - ((totalSavingsPool/a.target)*100);
    };
    actives.sort(sortingLogic);

    actives.forEach(goal => {
        let percent = (totalSavingsPool / goal.target) * 100;
        if (percent > 100) percent = 100; if(percent < 0) percent = 0;
        const isDone = percent >= 100;

        const card = document.createElement('div');
        card.classList.add('goal-item-card');
        card.innerHTML = `
            <div class="goal-header-info">
                <span>🎯 ${goal.name}</span>
                <span class="${isDone ? 'text-success':'text-primary'}">${totalSavingsPool.toFixed(0)} / ${goal.target} บาท</span>
            </div>
            <div class="goal-meta-time">สร้างเมื่อ: ${goal.dateStr} เวลา ${goal.timeStr}</div>
            ${goal.note ? `<div class="goal-note-text">📝 ${goal.note}</div>` : ''}
            <div class="goal-progress-box">
                <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${percent}%; background-color: ${isDone ? 'var(--success-color)' : 'var(--primary-color)'}"></div></div>
                <div style="font-size:0.75rem; text-align:right; margin-top:2px; font-weight:bold;">คืบหน้า ${percent.toFixed(0)}%</div>
            </div>
            <div class="goal-actions-btns">
                ${isDone ? `<button class="btn-action edit" style="background:#10b981;" onclick="updateGoalStatus(${goal.id}, 'completed')">🎉 สำเร็จเป้าหมาย</button>` : ''}
                <button class="btn-action edit" onclick="openEditGoal(${goal.id})">✏️ แก้ไข</button>
                <button class="btn-action cancel" onclick="updateGoalStatus(${goal.id}, 'cancelled')">❌ ยกเลิก</button>
                <button class="btn-action delete" onclick="deleteGoal(${goal.id})">🗑️ ลบ</button>
            </div>
        `;
        activeList.appendChild(card);
    });

    histories.forEach(goal => {
        const card = document.createElement('div');
        card.classList.add('goal-item-card', 'history-mode');
        card.innerHTML = `
            <div class="goal-header-info"><span>${goal.status === 'completed' ? '✅' : '🚫'} ${goal.name}</span><span>เป้าหมาย: ${goal.target} บาท</span></div>
            <div class="goal-meta-time">สถานะ: <strong>${goal.status === 'completed' ? 'ทำสำเร็จแล้ว' : 'ยกเลิกภารกิจ'}</strong></div>
            <div class="goal-actions-btns"><button class="btn-action delete" onclick="deleteGoalPermanent(${goal.id})">🗑️ ลบถาวร</button></div>
        `;
        historyList.appendChild(card);
    });
}

function updateGoalStatus(id, nextStatus) {
    const goal = goalsData.find(g => g.id === id);
    if(goal) { goal.status = nextStatus; saveGoalsToStorage(); renderGoalsPage(); }
}
function deleteGoal(id) { updateGoalStatus(id, 'cancelled'); }
function deleteGoalPermanent(id) { goalsData = goalsData.filter(g => g.id !== id); saveGoalsToStorage(); renderGoalsPage(); }

function openEditGoal(id) {
    const goal = goalsData.find(g => g.id === id);
    if(goal) {
        editingGoalId = id;
        document.getElementById('editGoalName').value = goal.name;
        document.getElementById('editGoalTarget').value = goal.target;
        document.getElementById('editGoalNote').value = goal.note;
        document.getElementById('editGoalModal').style.display = 'flex';
    }
}

document.getElementById('submitEditGoalBtn').addEventListener('click', () => {
    document.getElementById('editGoalModal').style.display = 'none';
    document.getElementById('confirmTimeModal').style.display = 'flex';
});

document.getElementById('confirmTimeYes').addEventListener('click', () => executeSaveGoalEdit(true));
document.getElementById('confirmTimeNo').addEventListener('click', () => executeSaveGoalEdit(false));

function executeSaveGoalEdit(shouldUpdateTime) {
    const goal = goalsData.find(g => g.id === editingGoalId);
    if(goal) {
        goal.name = document.getElementById('editGoalName').value.trim();
        goal.target = Number(document.getElementById('editGoalTarget').value) || 0;
        goal.note = document.getElementById('editGoalNote').value.trim();
        if (shouldUpdateTime) {
            goal.dateStr = new Date().toLocaleDateString('th-TH');
            goal.timeStr = new Date().toTimeString().split(' ')[0];
        }
        saveGoalsToStorage(); document.getElementById('confirmTimeModal').style.display = 'none'; renderGoalsPage();
    }
}

// แบ็กอัปข้อมูล
document.getElementById('exportBtn').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ financial: financialData, goals: goalsData }));
    const dl = document.createElement('a'); dl.setAttribute("href", dataStr); dl.setAttribute("download", `MC_Main_Backup.json`); dl.click();
});
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('fileInput').click());
document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsed = JSON.parse(evt.target.result);
            if(parsed.financial || parsed.goals) {
                financialData = parsed.financial || {}; goalsData = parsed.goals || [];
                localStorage.setItem('MC_FinancialData', JSON.stringify(financialData)); saveGoalsToStorage(); renderCalendar(); alert('นำเข้าสำเร็จ!');
            }
        } catch (e) { alert('ไฟล์ชำรุด'); }
    };
    reader.readAsText(file);
});

renderCalendar();