// Код для перетаскивания калькулятора
const calculator = document.getElementById("calculator-container");

let isDragging = false;
let startX;
let startY;
let initialX;
let initialY;

calculator.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = calculator.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newX = initialX + dx;
    const newY = initialY + dy;

    calculator.style.left = `${newX}px`;
    calculator.style.top = `${newY}px`;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Код для переключения тем
const themeButtons = document.querySelectorAll('.theme-button');
const body = document.body;

themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const theme = button.dataset.theme;

        // Удаляем все классы тем
        body.classList.remove('theme-blue-yellow', 'theme-green-beige', 'theme-purple-pink');

        // Добавляем класс для выбранной темы, если это не тема по умолчанию
        if (theme !== 'default') {
            body.classList.add(`theme-${theme}`);
        }

        // Обновляем активную кнопку
        themeButtons.forEach(btn => btn.classList.remove('active-theme'));
        button.classList.add('active-theme');
    });
});


// Код для логики калькулятора
const display = document.getElementById("display");
const keys = document.querySelector(".keys");

let firstValue = null;
let operator = null;
let waitingForSecondValue = false;

function updateDisplay(value) {
    if (String(value).length > 15) {
        display.textContent = 'Error';
    } else {
        display.textContent = value;
    }
}

function calculate(n1, op, n2) {
    const num1 = parseFloat(n1);
    const num2 = parseFloat(n2);

    if (op === 'plus') return num1 + num2;
    if (op === 'minus') return num1 - num2;
    if (op === 'multiply') return num1 * num2;
    if (op === 'divide') {
        if (num2 === 0) return 'Error';
        return num1 / num2;
    }
    return num2;
}

keys.addEventListener("click", (e) => {
    const target = e.target;
    if (!target.matches("button")) return;

    const action = target.dataset.action;
    const digit = target.dataset.digit;
    const displayedValue = display.textContent;

    if (digit) {
        if (waitingForSecondValue) {
            updateDisplay(digit);
            waitingForSecondValue = false;
        } else if (digit === '.') {
            if (!displayedValue.includes('.')) {
                updateDisplay(displayedValue + '.');
            }
        } else {
            updateDisplay(displayedValue === '0' ? digit : displayedValue + digit);
        }
        return;
    }

    if (action === 'plus' || action === 'minus' || action === 'multiply' || action === 'divide') {
        if (firstValue === null) {
            firstValue = displayedValue;
        } else if (operator) {
            const result = calculate(firstValue, operator, displayedValue);
            updateDisplay(result);
            firstValue = result;
        }
        operator = action;
        waitingForSecondValue = true;
        return;
    }

    if (action === 'equals') {
        if (firstValue === null || operator === null) return;
        
        const result = calculate(firstValue, operator, displayedValue);
        updateDisplay(result);
        
        firstValue = result;
        operator = null;
        waitingForSecondValue = true;
        return;
    }

    if (action === 'clear') {
        firstValue = null;
        operator = null;
        waitingForSecondValue = false;
        updateDisplay('0');
        return;
    }
    
    if (action === 'delete') {
        if (waitingForSecondValue) {
            updateDisplay('0');
            waitingForSecondValue = false;
        } else {
            let newDisplay = displayedValue.length === 1 ? '0' : displayedValue.slice(0, -1);
            updateDisplay(newDisplay);
        }
        return;
    }

    if (action === 'percent') {
        const value = parseFloat(displayedValue) / 100;
        updateDisplay(String(value));
        return;
    }
});