// --- Optimized Drag and Drop Code (Calculator Movement) ---

const calculator = document.getElementById("calculator-container");
const display = document.getElementById("display"); 
const keys = document.querySelector(".keys"); 
const siteTitle = document.querySelector(".site-title"); // Get site title element

let isDragging = false;
let startX;
let startY;
let currentTranslateX = 0; 
let currentTranslateY = 0; 
let isJokeThemeActive = false; // State for joke theme

// Increased distance for "jump" (250 is already good)
const JOKE_FACTOR_JUMP = 250; 
// Added random factor multiplier (max 50% deviation from direct flee)
const RANDOM_DIVERSION_FACTOR = 0.5; 

let animationFrameId;
let isRunningAway = false; 

let targetX = 0;
let targetY = 0;

/**
 * Sets the calculator to the center of the viewport (initial setup or window resize).
 */
function setInitialPosition() {
    const rect = calculator.getBoundingClientRect();
    currentTranslateX = (window.innerWidth / 2) - (rect.width / 2);
    currentTranslateY = (window.innerHeight / 2) - (rect.height / 2);
    
    targetX = currentTranslateX;
    targetY = currentTranslateY;
    
    calculator.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px)`;
    calculator.style.position = 'absolute';
}

// Initial positioning on load
document.addEventListener('DOMContentLoaded', setInitialPosition);
// Reposition on window resize
window.addEventListener('resize', setInitialPosition); 

let e; // Variable to store the last mouse event

/**
 * Updates the calculator's position using requestAnimationFrame for smooth movement.
 * In joke mode, this function executes the jump logic.
 */
function updatePosition() {
    
    // --- JOKE THEME LOGIC: FAST, CHAOTIC JUMP AWAY ---
    if (isJokeThemeActive && isRunningAway) {
        
        const calcRect = calculator.getBoundingClientRect();
        const calcCenterX = calcRect.left + calcRect.width / 2;
        const calcCenterY = calcRect.top + calcRect.height / 2;
        
        // 1. Base Flee Vector (away from cursor)
        const dx_flee = calcCenterX - e.clientX; 
        const dy_flee = calcCenterY - e.clientY;
        
        // Determine run direction (normalized to -1 or 1)
        const baseDirectionX = Math.sign(dx_flee); 
        const baseDirectionY = Math.sign(dy_flee);
        
        // 2. Random Diversion
        // Generates a random value between -RANDOM_DIVERSION_FACTOR and +RANDOM_DIVERSION_FACTOR
        const randomX = (Math.random() * 2 - 1) * RANDOM_DIVERSION_FACTOR; 
        const randomY = (Math.random() * 2 - 1) * RANDOM_DIVERSION_FACTOR;
        
        // 3. Combine Vectors and Apply Jump
        
        // Apply a large, instant jump, biased towards fleeing but with random component
        targetX = currentTranslateX + (JOKE_FACTOR_JUMP * (baseDirectionX + randomX));
        targetY = currentTranslateY + (JOKE_FACTOR_JUMP * (baseDirectionY + randomY));
        
        // 4. Boundary Check (keeps it roughly on screen)
        const boundaryMaxX = window.innerWidth - calcRect.width;
        const boundaryMaxY = window.innerHeight - calcRect.height;
        targetX = Math.min(Math.max(targetX, 0), boundaryMaxX);
        targetY = Math.min(Math.max(targetY, 0), boundaryMaxY);

        // Apply the new position instantly (the "jump")
        currentTranslateX = targetX;
        currentTranslateY = targetY;
        
        calculator.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px)`;
        
        // Stop running state immediately after the jump
        isRunningAway = false;
        calculator.classList.remove('is-dragging'); 
        display.textContent = '😅'; 

        // Important: Cancel the loop, as we only need one jump per interaction
        window.cancelAnimationFrame(animationFrameId);
        return;
    } 

    // --- NORMAL DRAGGING LOGIC (Using requestAnimationFrame for smoothness) ---
    if (isDragging && !isJokeThemeActive) {
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        
        targetX = currentTranslateX + dx;
        targetY = currentTranslateY + dy;
        
        calculator.style.transform = `translate(${targetX}px, ${targetY}px)`;
        
        // Keep the loop running for smooth drag
        animationFrameId = window.requestAnimationFrame(updatePosition);
        return;
    }
}

// Mouse Down Event (Start Interaction)
calculator.addEventListener('mousedown', (event) => {
    // Ignore clicks on calculator buttons
    if (event.target.matches('.key')) return; 

    // 1. Get current position 
    const style = window.getComputedStyle(calculator);
    const transformValue = style.transform;
    if (transformValue && transformValue !== 'none') {
        const matrix = new WebKitCSSMatrix(transformValue);
        currentTranslateX = matrix.m41;
        currentTranslateY = matrix.m42;
    } 
    
    e = event; // Store event

    if (isJokeThemeActive) {
        // Prepare for jump
        isRunningAway = true;
        calculator.classList.add('is-dragging'); // Triggers leg animation
        display.textContent = '😨';
        // Trigger the jump on mouse down
        updatePosition(); 
    } else {
        // Start normal dragging
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        calculator.classList.add('is-dragging');
        animationFrameId = window.requestAnimationFrame(updatePosition);
    }
    
    event.preventDefault();
});

// Mouse Move Event (Update Pointer Position)
document.addEventListener('mousemove', (event) => {
    // In joke mode, movement is ignored as the jump happens instantly on mousedown/mouseup
    if (isDragging) {
        e = event; // Update stored event for next requestAnimationFrame (normal drag)
    }
});

// Mouse Up Event (Stop Interaction)
document.addEventListener('mouseup', () => {
    if (!isDragging && !isRunningAway) return;

    if (isJokeThemeActive) {
        // If the click lasted a while, ensure animation state is reset
        isRunningAway = false;
        calculator.classList.remove('is-dragging');
        display.textContent = '😅';
    } else {
        // Stop normal drag
        window.cancelAnimationFrame(animationFrameId); 
        currentTranslateX = targetX;
        currentTranslateY = targetY;
        isDragging = false;
        calculator.classList.remove('is-dragging');
    }
});

// --- Theme Switching Code ---
const themeButtons = document.querySelectorAll('.theme-button');
const body = document.body;

themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const theme = button.dataset.theme;

        // Check if the joke theme is activated
        isJokeThemeActive = (theme === 'joke');
        
        // --- H1 JOKE FIX ---
        siteTitle.textContent = isJokeThemeActive ? 'Joke Calculator' : 'Calculator';
        
        // Reset running state when switching themes
        isRunningAway = false;
        window.cancelAnimationFrame(animationFrameId); 

        // Remove all theme classes
        body.classList.remove('theme-blue-yellow', 'theme-green-beige', 'theme-purple-pink', 'theme-joke');

        // Add the selected theme class
        if (theme !== 'default') {
            body.classList.add(`theme-${theme}`);
        }

        // Update active button state
        themeButtons.forEach(btn => btn.classList.remove('active-theme'));
        button.classList.add('active-theme');
        
        // Reset calculator display when switching themes
        if (display.textContent === '😨' || display.textContent === '😅') {
             updateDisplay('0');
        }
    });
});


// --- Calculator Logic (Unchanged) ---

let firstValue = null;
let operator = null;
let waitingForSecondValue = false;
let previousKeyType = 'clear'; 

function updateDisplay(value) {
    const valueString = String(value);
    if (valueString === 'Infinity' || valueString.length > 15) {
        display.textContent = 'Error';
    } else {
        display.textContent = valueString;
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

    // IMPORTANT: If running away, calculator keys shouldn't work.
    if (isJokeThemeActive) {
        return; 
    }

    const action = target.dataset.action;
    const digit = target.dataset.digit;
    let displayedValue = display.textContent;
    let result = null;

    if (digit) {
        if (waitingForSecondValue || displayedValue === 'Error') {
            updateDisplay(digit === '.' ? '0.' : digit);
            waitingForSecondValue = false;
        } else if (digit === '.') {
            if (!displayedValue.includes('.')) {
                updateDisplay(displayedValue + '.');
            }
        } else {
            updateDisplay(displayedValue === '0' ? digit : displayedValue + digit);
        }
        previousKeyType = 'digit';
        return;
    }

    if (action === 'plus' || action === 'minus' || action === 'multiply' || action === 'divide') {
        
        if (firstValue !== null && operator !== null && previousKeyType !== 'operator') {
            result = calculate(firstValue, operator, displayedValue);
            updateDisplay(result);
            firstValue = result; 
        } else if (firstValue === null || displayedValue === 'Error') {
            firstValue = displayedValue;
        }
        
        operator = action; 
        waitingForSecondValue = true; 
        previousKeyType = 'operator';
        return;
    }

    if (action === 'equals') {
        if (firstValue === null || operator === null) return;
        
        let secondValue = waitingForSecondValue ? firstValue : displayedValue;
        
        result = calculate(firstValue, operator, secondValue);
        updateDisplay(result);
        
        firstValue = result; 
        operator = null; 
        waitingForSecondValue = true; 
        previousKeyType = 'equals';
        return;
    }

    if (action === 'clear') {
        firstValue = null;
        operator = null;
        waitingForSecondValue = false;
        updateDisplay('0');
        previousKeyType = 'clear';
        return;
    }
    
    if (action === 'delete') {
        if (displayedValue === 'Error' || displayedValue === '😨' || displayedValue === '😅') {
             updateDisplay('0');
        } else if (!waitingForSecondValue) {
            let newDisplay = displayedValue.length === 1 || displayedValue === '0' ? '0' : displayedValue.slice(0, -1);
            updateDisplay(newDisplay);
        }
        previousKeyType = 'delete';
        return;
    }

    if (action === 'percent') {
        const value = parseFloat(displayedValue) / 100;
        updateDisplay(String(value));
        waitingForSecondValue = true;
        previousKeyType = 'percent';
        return;
    }
});