(() => {
  "use strict";

  const displayEl = document.getElementById("display");
  const expressionEl = document.getElementById("expression");

  const OP_SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  let currentInput = "0";
  let previousInput = "";
  let operator = null;
  let shouldResetInput = false;
  let lastResult = null;

  // ── Display helpers ──────────────────────────────────
  function updateDisplay() {
    displayEl.textContent = formatNumber(currentInput);

    // Shrink text for long numbers
    const len = currentInput.replace(/[^0-9.]/g, "").length;
    displayEl.classList.toggle("shrink", len > 10 && len <= 14);
    displayEl.classList.toggle("shrink-more", len > 14);
  }

  function updateExpression() {
    if (operator && previousInput) {
      expressionEl.textContent =
        formatNumber(previousInput) + " " + OP_SYMBOLS[operator];
    } else {
      expressionEl.textContent = "";
    }
  }

  function formatNumber(val) {
    if (val === "Error") return "Error";
    // Don't format while user is still typing decimals like "3."
    if (typeof val === "string" && val.endsWith(".")) return val;
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    // Large/small numbers in scientific notation
    if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
      return num.toExponential(6);
    }
    // Reasonable precision
    const str = parseFloat(num.toPrecision(12)).toString();
    return str;
  }

  // ── Calculator logic ─────────────────────────────────
  function inputNumber(digit) {
    if (shouldResetInput) {
      currentInput = digit;
      shouldResetInput = false;
    } else {
      if (currentInput === "0" && digit !== "0") {
        currentInput = digit;
      } else if (currentInput === "0" && digit === "0") {
        // no-op
      } else {
        if (currentInput.replace(/[^0-9]/g, "").length >= 16) return;
        currentInput += digit;
      }
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (shouldResetInput) {
      currentInput = "0.";
      shouldResetInput = false;
    } else if (!currentInput.includes(".")) {
      currentInput += ".";
    }
    updateDisplay();
  }

  function setOperator(op) {
    if (operator && !shouldResetInput) {
      calculate();
    }
    previousInput = currentInput;
    operator = op;
    shouldResetInput = true;
    updateExpression();
    highlightOp(op);
  }

  function calculate() {
    if (!operator || !previousInput) return;

    const a = parseFloat(previousInput);
    const b = parseFloat(currentInput);
    let result;

    switch (operator) {
      case "+": result = a + b; break;
      case "-": result = a - b; break;
      case "*": result = a * b; break;
      case "/":
        if (b === 0) {
          currentInput = "Error";
          previousInput = "";
          operator = null;
          shouldResetInput = true;
          updateDisplay();
          updateExpression();
          clearHighlight();
          return;
        }
        result = a / b;
        break;
    }

    // Build expression string for display
    expressionEl.textContent =
      formatNumber(previousInput) +
      " " + OP_SYMBOLS[operator] +
      " " + formatNumber(currentInput) +
      " =";

    currentInput = String(result);
    lastResult = result;
    previousInput = "";
    operator = null;
    shouldResetInput = true;
    updateDisplay();
    clearHighlight();
  }

  function handlePercent() {
    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    if (operator && previousInput) {
      // e.g. 200 + 10% → 200 + 20
      currentInput = String((parseFloat(previousInput) * num) / 100);
    } else {
      currentInput = String(num / 100);
    }
    updateDisplay();
  }

  function clearAll() {
    currentInput = "0";
    previousInput = "";
    operator = null;
    shouldResetInput = false;
    lastResult = null;
    updateDisplay();
    updateExpression();
    clearHighlight();
  }

  function backspace() {
    if (shouldResetInput || currentInput === "Error") {
      clearAll();
      return;
    }
    currentInput = currentInput.slice(0, -1) || "0";
    updateDisplay();
  }

  // ── Operator highlight ───────────────────────────────
  function highlightOp(op) {
    document.querySelectorAll(".btn-op").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.value === op);
    });
  }

  function clearHighlight() {
    document.querySelectorAll(".btn-op").forEach((btn) => {
      btn.classList.remove("active");
    });
  }

  // ── Event delegation ─────────────────────────────────
  document.querySelector(".keypad").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    switch (action) {
      case "number":   inputNumber(value); break;
      case "decimal":  inputDecimal(); break;
      case "operator": setOperator(value); break;
      case "equals":   calculate(); break;
      case "clear":    clearAll(); break;
      case "backspace": backspace(); break;
      case "percent":  handlePercent(); break;
    }
  });

  // ── Keyboard support ─────────────────────────────────
  document.addEventListener("keydown", (e) => {
    const key = e.key;

    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      inputNumber(key);
    } else if (key === ".") {
      e.preventDefault();
      inputDecimal();
    } else if (key === "+" || key === "-") {
      e.preventDefault();
      setOperator(key);
    } else if (key === "*") {
      e.preventDefault();
      setOperator("*");
    } else if (key === "/") {
      e.preventDefault();
      setOperator("/");
    } else if (key === "Enter" || key === "=") {
      e.preventDefault();
      calculate();
    } else if (key === "Escape" || key === "c" || key === "C") {
      e.preventDefault();
      clearAll();
    } else if (key === "Backspace") {
      e.preventDefault();
      backspace();
    } else if (key === "%") {
      e.preventDefault();
      handlePercent();
    }
  });

  // ── Init ─────────────────────────────────────────────
  updateDisplay();
})();
