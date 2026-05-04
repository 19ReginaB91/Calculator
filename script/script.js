const calculator = document.getElementById("calculator-container");
const display = document.getElementById("display");
const keys = document.querySelector(".keys");
const siteTitle = document.querySelector(".site-title");
const themeButtons = document.querySelectorAll(".theme-button");
const body = document.body;

let isDragging = false;
let isJokeThemeActive = false;
let activePointerId = null;

let startX = 0;
let startY = 0;
let currentTranslateX = 0;
let currentTranslateY = 0;
let dragStartTranslateX = 0;
let dragStartTranslateY = 0;

let animationFrameId = null;

function getViewportBounds() {
    const rect = calculator.getBoundingClientRect();

    return {
        maxX: Math.max(window.innerWidth - rect.width, 0),
        maxY: Math.max(window.innerHeight - rect.height, 0)
    };
}

function applyCalculatorPosition(x, y) {
    currentTranslateX = x;
    currentTranslateY = y;
    calculator.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px)`;
}

function setInitialPosition() {
    const rect = calculator.getBoundingClientRect();
    const x = (window.innerWidth / 2) - (rect.width / 2);
    const y = (window.innerHeight / 2) - (rect.height / 2);

    applyCalculatorPosition(Math.max(x, 0), Math.max(y, 0));
}

function getCurrentTransformPosition() {
    const style = window.getComputedStyle(calculator);
    const transformValue = style.transform;

    if (transformValue && transformValue !== "none") {
        const matrix = new DOMMatrixReadOnly(transformValue);
        currentTranslateX = matrix.m41;
        currentTranslateY = matrix.m42;
    }
}

function getFarthestCorner(pointerX, pointerY) {
    const rect = calculator.getBoundingClientRect();
    const bounds = getViewportBounds();

    const corners = [
        { x: 0, y: 0 },
        { x: bounds.maxX, y: 0 },
        { x: 0, y: bounds.maxY },
        { x: bounds.maxX, y: bounds.maxY }
    ];

    let farthestCorner = corners[0];
    let farthestDistance = -1;

    corners.forEach(corner => {
        const centerX = corner.x + rect.width / 2;
        const centerY = corner.y + rect.height / 2;
        const distance = Math.hypot(centerX - pointerX, centerY - pointerY);

        if (distance > farthestDistance) {
            farthestDistance = distance;
            farthestCorner = corner;
        }
    });

    return farthestCorner;
}

function runAway(pointerX, pointerY) {
    getCurrentTransformPosition();

    const target = getFarthestCorner(pointerX, pointerY);
    const startTranslateX = currentTranslateX;
    const startTranslateY = currentTranslateY;

    const duration = 520;
    const startTime = performance.now();

    calculator.classList.add("is-dragging");
    display.textContent = "😨";

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    function easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;

        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutBack(progress);

        const nextX = startTranslateX + (target.x - startTranslateX) * eased;
        const nextY = startTranslateY + (target.y - startTranslateY) * eased;

        applyCalculatorPosition(nextX, nextY);

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            applyCalculatorPosition(target.x, target.y);
            calculator.classList.remove("is-dragging");
            display.textContent = "😅";
            animationFrameId = null;
        }
    }

    animationFrameId = requestAnimationFrame(animate);
}

function startDrag(event) {
    if (event.target.matches(".key") || event.target.closest(".theme-switcher")) {
        return;
    }

    getCurrentTransformPosition();

    if (isJokeThemeActive) {
        runAway(event.clientX, event.clientY);
        return;
    }

    isDragging = true;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dragStartTranslateX = currentTranslateX;
    dragStartTranslateY = currentTranslateY;

    calculator.classList.add("is-dragging");
    calculator.setPointerCapture(activePointerId);

    event.preventDefault();
}

function moveDrag(event) {
    if (!isDragging || event.pointerId !== activePointerId || isJokeThemeActive) {
        return;
    }

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    const bounds = getViewportBounds();
    const nextX = Math.min(Math.max(dragStartTranslateX + dx, 0), bounds.maxX);
    const nextY = Math.min(Math.max(dragStartTranslateY + dy, 0), bounds.maxY);

    applyCalculatorPosition(nextX, nextY);
}

function endDrag(event) {
    if (!isDragging || event.pointerId !== activePointerId) {
        return;
    }

    isDragging = false;
    calculator.classList.remove("is-dragging");

    if (calculator.hasPointerCapture(activePointerId)) {
        calculator.releasePointerCapture(activePointerId);
    }

    activePointerId = null;
}

function resetCalculatorState() {
    firstValue = null;
    operator = null;
    waitingForSecondValue = false;
    previousKeyType = "clear";
    updateDisplay("0");
}

function applyTheme(theme) {
    isJokeThemeActive = theme === "joke";

    siteTitle.textContent = isJokeThemeActive ? "Joke Calculator" : "Calculator";

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    calculator.classList.remove("is-dragging");
    body.classList.remove("theme-blue-yellow", "theme-green-beige", "theme-purple-pink", "theme-joke");
    calculator.classList.remove("theme-joke");

    if (theme !== "default") {
        body.classList.add(`theme-${theme}`);
    }

    if (isJokeThemeActive) {
        calculator.classList.add("theme-joke");
    }

    themeButtons.forEach(button => {
        button.classList.toggle("active-theme", button.dataset.theme === theme);
    });

    resetCalculatorState();
}

themeButtons.forEach(button => {
    button.addEventListener("click", () => {
        applyTheme(button.dataset.theme);
    });
});

calculator.addEventListener("pointerdown", startDrag);
calculator.addEventListener("pointermove", moveDrag);
calculator.addEventListener("pointerup", endDrag);
calculator.addEventListener("pointercancel", endDrag);

window.addEventListener("resize", () => {
    const bounds = getViewportBounds();
    const nextX = Math.min(currentTranslateX, bounds.maxX);
    const nextY = Math.min(currentTranslateY, bounds.maxY);

    applyCalculatorPosition(nextX, nextY);
});

document.addEventListener("DOMContentLoaded", setInitialPosition);


// Calculator logic

let firstValue = null;
let operator = null;
let waitingForSecondValue = false;
let previousKeyType = "clear";

function updateDisplay(value) {
    const valueString = String(value);

    if (valueString === "Infinity" || valueString === "NaN" || valueString.length > 15) {
        display.textContent = "Error";
    } else {
        display.textContent = valueString;
    }
}

function calculate(n1, op, n2) {
    const num1 = parseFloat(n1);
    const num2 = parseFloat(n2);

    if (Number.isNaN(num1) || Number.isNaN(num2)) return "Error";

    if (op === "plus") return num1 + num2;
    if (op === "minus") return num1 - num2;
    if (op === "multiply") return num1 * num2;
    if (op === "divide") {
        if (num2 === 0) return "Error";
        return num1 / num2;
    }

    return num2;
}

keys.addEventListener("click", (event) => {
    const target = event.target;

    if (!target.matches("button")) return;

    if (isJokeThemeActive) {
        return;
    }

    const action = target.dataset.action;
    const digit = target.dataset.digit;
    const displayedValue = display.textContent;
    let result = null;

    if (digit) {
        if (waitingForSecondValue || displayedValue === "Error") {
            updateDisplay(digit === "." ? "0." : digit);
            waitingForSecondValue = false;
        } else if (digit === ".") {
            if (!displayedValue.includes(".")) {
                updateDisplay(displayedValue + ".");
            }
        } else {
            updateDisplay(displayedValue === "0" ? digit : displayedValue + digit);
        }

        previousKeyType = "digit";
        return;
    }

    if (action === "plus" || action === "minus" || action === "multiply" || action === "divide") {
        if (displayedValue === "Error") {
            resetCalculatorState();
            return;
        }

        if (firstValue !== null && operator !== null && previousKeyType !== "operator") {
            result = calculate(firstValue, operator, displayedValue);
            updateDisplay(result);
            firstValue = result;
        } else if (firstValue === null) {
            firstValue = displayedValue;
        }

        operator = action;
        waitingForSecondValue = true;
        previousKeyType = "operator";
        return;
    }

    if (action === "equals") {
        if (firstValue === null || operator === null || displayedValue === "Error") return;

        const secondValue = waitingForSecondValue ? firstValue : displayedValue;

        result = calculate(firstValue, operator, secondValue);
        updateDisplay(result);

        firstValue = result;
        operator = null;
        waitingForSecondValue = true;
        previousKeyType = "equals";
        return;
    }

    if (action === "clear") {
        resetCalculatorState();
        return;
    }

    if (action === "delete") {
        if (displayedValue === "Error") {
            updateDisplay("0");
        } else if (!waitingForSecondValue) {
            const newDisplay = displayedValue.length === 1 || displayedValue === "0" ? "0" : displayedValue.slice(0, -1);
            updateDisplay(newDisplay);
        }

        previousKeyType = "delete";
        return;
    }

    if (action === "percent") {
        if (displayedValue === "Error") {
            resetCalculatorState();
            return;
        }

        const value = parseFloat(displayedValue) / 100;
        updateDisplay(String(value));
        waitingForSecondValue = true;
        previousKeyType = "percent";
    }
});