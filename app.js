let cardData = {};
let currentDeck = [];
let allCards = [];
let selectedType = null;
let config = {
    shuffleBack: false,
    showRemaining: true,
    showShuffleCard: true
};

window.onload = async () => {
    const res = await fetch('cards.json');
    cardData = await res.json();
    renderCardTypeSelection();
};

function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`step${step}`).classList.remove('hidden');
}

function renderCardTypeSelection() {
    const container = document.getElementById('cardTypeSelection');
    container.innerHTML = '';
    for (const type in cardData.cardTypes) {
        const t = cardData.cardTypes[type];
        const div = document.createElement('div');
        div.className = 'deck-option';
        div.style.background = t.bgColor || '#fff';
        div.style.color = t.textColor || '#222';
        div.style.borderColor = t.iconColor || '#007bff';
        div.innerHTML = `
            <div style="font-size:2.5rem; color:${t.iconColor || '#007bff'}; margin-bottom:0.5rem;">
                ${t.icon || ''}
            </div>
            <div class="font-bold mb-1" style="color:${t.textColor || '#222'}">${t.displayName}</div>
            <div class="text-xs" style="color:${t.textColor || '#222'}">${t.startText || ''}</div>
        `;
        div.onclick = () => {
            selectedType = type;
            goToStep(2);
            updateCategories();
        };
        container.appendChild(div);
    }
}

// ...existing code...
function updateCategories() {
    const categories = cardData.cardTypes[selectedType].categories;
    const container = document.getElementById('categoryContainer');
    container.innerHTML = '';
    let total = 0;
    for (const cat in categories) {
        const count = categories[cat].reduce((s, c) => s + c.count, 0);
        total += count;
        const div = document.createElement('div');
        div.className = 'category-row flex items-center justify-between w-full max-w-[400px]';
        div.innerHTML = `
            <label class="flex items-center gap-2">
                <input type="checkbox" value="${cat}" checked class="categoryCheckbox"> 
                <span>${cat} (${count} ใบ)</span>
            </label>
            <button type="button" class="edit-btn">แก้ไข</button>
        `;
        div.querySelector('button').onclick = () => openEdit(cat);
        container.appendChild(div);
    }
    // แสดงยอดรวม
    document.getElementById('totalCardCount').textContent = `ยอดรวมการ์ดทั้งหมด: ${total} ใบ`;

    // set default: shuffleBack = false, showRemaining = true
    document.getElementById('shuffleBack').checked = config.shuffleBack;
    document.getElementById('showRemaining').checked = config.showRemaining;
    document.getElementById('showShuffleCard').checked = config.showShuffleCard;
    document.querySelectorAll('.categoryCheckbox').forEach(i => i.addEventListener('change', buildDeck));
    document.getElementById('shuffleBack').onchange = e => config.shuffleBack = e.target.checked;
    document.getElementById('showRemaining').onchange = e => config.showRemaining = e.target.checked;
    document.getElementById('showShuffleCard').onchange = e => config.showShuffleCard = e.target.checked;
    buildDeck();
}
// ...existing code...

function buildDeck() {
    const categories = cardData.cardTypes[selectedType].categories;
    const selectedCats = [...document.querySelectorAll('.categoryCheckbox:checked')].map(i => i.value);
    currentDeck = [];
    allCards = [];
    selectedCats.forEach(cat => {
        categories[cat].forEach(card => {
            for (let i = 0; i < card.count; i++) currentDeck.push(card);
            allCards.push({ ...card });
        });
    });
}

function openEdit(category) {
    const container = document.getElementById('cardListContainer');
    const cards = cardData.cardTypes[selectedType].categories[category];
    container.innerHTML = '';
    cards.forEach(card => {
        container.innerHTML += `<div>
      <label>${card.thaiText}</label>
      <input type="number" value="${card.count}" min="0" onchange="updateCardCount('${category}','${card.id}',this.value)">
    </div>`;
    });
    document.getElementById('editOverlay').classList.remove('hidden');
}

function closeEdit() {
    document.getElementById('editOverlay').classList.add('hidden');
    buildDeck();
    updateCategories();
}

function updateCardCount(category, id, val) {
    const cards = cardData.cardTypes[selectedType].categories[category];
    const card = cards.find(c => c.id === id);
    card.count = parseInt(val);
}

function startGame() {
    if (currentDeck.length === 0) {
        alert('กรุณาเลือกหมวดหมู่ที่มีการ์ด');
        return;
    }
    goToStep(3);
    document.getElementById('result').innerHTML = '';
    if (config.showRemaining) {
        document.getElementById('remaining').textContent = `เหลือ: ${currentDeck.length} ใบ`;
    }
    // แสดง startText ในกล่องการ์ด
    const type = cardData.cardTypes[selectedType];
    document.getElementById('result').innerHTML = `
        <div class="card bg-white border rounded shadow flex items-center justify-center text-gray-700 text-center p-4 min-h-[120px] w-[140px] h-[196px]">
            ${type.startText || 'เริ่มสุ่มการ์ด!'}
        </div>
    `;
    updateStep3Buttons();
}

function updateStep3Buttons() {
    const drawBtn = document.getElementById('drawCard');
    const reshuffleBtn = document.getElementById('reshuffleBtn');
    const resetBtn = document.getElementById('resetBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    if (currentDeck.length === 0) {
        // สุ่มหมดแล้ว
        drawBtn.classList.add('hidden');
        cancelBtn.classList.add('hidden');
        resetBtn.classList.remove('hidden');
        reshuffleBtn.classList.remove('hidden');
    } else {
        // ยังสุ่มไม่หมด
        drawBtn.classList.remove('hidden');
        cancelBtn.classList.remove('hidden');
        resetBtn.classList.add('hidden');
        reshuffleBtn.classList.add('hidden');
    }
}
// ...existing code...
function renderCard(card) {
    const type = cardData.cardTypes[selectedType];
    if (type.displayTemplate === "textCard") {
        // แบบ textCard
        const div = document.createElement('div');
        div.className = 'card relative bg-white border rounded shadow w-[140px] h-[196px] flex items-center justify-center p-2';
        div.textContent = card.thaiText;
        return div;
    } else if (type.displayTemplate === "playingCard") {
        // แบบ playingCard
        const div = document.createElement('div');
        div.className = 'card relative bg-white border rounded shadow w-[140px] h-[196px] flex flex-col justify-between p-2';
        // มุมซ้ายบน
        const topLeft = document.createElement('div');
        topLeft.className = 'absolute left-2 top-2 text-lg font-bold';
        topLeft.innerHTML = `<span style="color:${card.iconColor || card.color};">${card.value}<br>${card.icon || ""}</span>`;
        // มุมขวาล่าง (กลับด้าน)
        const bottomRight = document.createElement('div');
        bottomRight.className = 'absolute right-2 bottom-2 text-lg font-bold rotate-180';
        bottomRight.innerHTML = `<span style="color:${card.iconColor || card.color};">${card.value}<br>${card.icon || ""}</span>`;
        // icon ตรงกลาง
        const centerIcon = document.createElement('div');
        centerIcon.className = 'flex-1 flex items-center justify-center text-5xl';
        centerIcon.innerHTML = `<span style="color:${card.iconColor || card.color};">${card.icon || ""}</span>`;
        div.appendChild(topLeft);
        div.appendChild(centerIcon);
        div.appendChild(bottomRight);
        return div;
    }
}

document.getElementById('drawCard').onclick = async () => {
    const drawBtn = document.getElementById('drawCard');
    // if (currentDeck.length === 0) {
    //     // แสดง endText เมื่อสุ่มหมด
    //     const type = cardData.cardTypes[selectedType];
    //     setTimeout(() => {
    //         document.getElementById('result').innerHTML = `
    //             <div class="card bg-white border rounded shadow flex items-center justify-center text-gray-700 text-center p-4 min-h-[120px] w-[140px] h-[196px]">
    //                 ${type.endText || 'สุ่มครบแล้ว!'}
    //             </div>
    //         `;
    //         updateStep3Buttons();
    //     }, 500);
    // }
    drawBtn.disabled = true;

    // เอฟเฟคสลับการ์ด
    if (config.showShuffleCard) {
        // เอฟเฟคสลับการ์ดแบบเดิม
        let interval;
        let fakeIdx = 0;
        interval = setInterval(() => {
            fakeIdx = Math.floor(Math.random() * currentDeck.length);
            const fakeCard = currentDeck[fakeIdx];
            document.getElementById('result').innerHTML = '';
            document.getElementById('result').appendChild(renderCard(fakeCard));
        }, 70);

        await new Promise(res => setTimeout(res, 700));
        clearInterval(interval);
    } else {
        // แสดง loading svg
        document.getElementById('result').innerHTML = `
            <div class="card relative bg-white border rounded shadow w-[140px] h-[196px] flex flex-col justify-center items-center p-2">
                <div class="flex-1 flex items-center justify-center">
                    <svg class="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                </div>
            </div>
        `;
        await new Promise(res => setTimeout(res, 700));
    }

    // แสดงการ์ดจริง
    const idx = Math.floor(Math.random() * currentDeck.length);
    const card = currentDeck[idx];
    if (!config.shuffleBack) currentDeck.splice(idx, 1);
    document.getElementById('result').innerHTML = '';
    document.getElementById('result').appendChild(renderCard(card));
    if (config.showRemaining) {
        document.getElementById('remaining').textContent = `เหลือ: ${currentDeck.length} ใบ`;
    }
    
    drawBtn.disabled = false;
    updateStep3Buttons();
};

function reshuffle() {
    buildDeck();
    document.getElementById('result').innerHTML = '';
    if (config.showRemaining) {
        document.getElementById('remaining').textContent = `เหลือ: ${currentDeck.length} ใบ`;
    }
    // แสดง startText ใหม่ในกล่องการ์ด
    const type = cardData.cardTypes[selectedType];
    document.getElementById('result').innerHTML = `
        <div class="card bg-white border rounded shadow flex items-center justify-center text-gray-700 text-center p-4 min-h-[120px] w-[140px] h-[196px]">
            ${type.startText || 'เริ่มสุ่มการ์ด!'}
        </div>
    `;
    updateStep3Buttons();
}

document.getElementById('reshuffleBtn').onclick = () => {
    reshuffle();
    updateStep3Buttons();
};

document.getElementById('resetBtn').onclick = () => {
    goToStep(1);
};

const cancelBtn = document.getElementById('cancelBtn');
const cancelModal = document.getElementById('cancelModal');
const closeCancelModal = document.getElementById('closeCancelModal');
const modalReshuffleBtn = document.getElementById('modalReshuffleBtn');
const modalResetBtn = document.getElementById('modalResetBtn');

cancelBtn.onclick = () => {
    cancelModal.classList.remove('hidden');
};
closeCancelModal.onclick = () => {
    cancelModal.classList.add('hidden');
};
modalReshuffleBtn.onclick = () => {
    cancelModal.classList.add('hidden');
    reshuffle();
    updateStep3Buttons();
};
modalResetBtn.onclick = () => {
    cancelModal.classList.add('hidden');
    goToStep(1);
};