const display = document.querySelector('#display');
const history = document.querySelector('#history');
let current = '0';
let previous = null;
let operator = null;
let fresh = false;
let degrees = true;
const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };

function render() {
  display.textContent = current.replace('.', ',');
  document.querySelectorAll('[data-operator]').forEach(button => {
    button.classList.toggle('selected', button.dataset.operator === operator);
  });
}

function calculate(a, b, operation) {
  if (operation === '+') return a + b;
  if (operation === '-') return a - b;
  if (operation === '*') return a * b;
  if (operation === '/') return b === 0 ? NaN : a / b;
  if (operation === '^') return a ** b;
}

function scientific(name) {
  if (current === 'Error') return;
  const value = Number(current);
  const angle = degrees ? value * Math.PI / 180 : value;
  const fromRadians = result => degrees ? result * 180 / Math.PI : result;
  let result;
  switch (name) {
    case 'sin': result = Math.sin(angle); break;
    case 'cos': result = Math.cos(angle); break;
    case 'tan': result = Math.abs(Math.cos(angle)) < 1e-14 ? NaN : Math.tan(angle); break;
    case 'asin': result = fromRadians(Math.asin(value)); break;
    case 'acos': result = fromRadians(Math.acos(value)); break;
    case 'atan': result = fromRadians(Math.atan(value)); break;
    case 'sqrt': result = Math.sqrt(value); break;
    case 'square': result = value ** 2; break;
    case 'log': result = Math.log10(value); break;
    case 'ln': result = Math.log(value); break;
    case 'exp': result = Math.exp(value); break;
    case 'inverse': result = value === 0 ? NaN : 1 / value; break;
    case 'factorial':
      result = NaN;
      if (Number.isInteger(value) && value >= 0 && value <= 170) {
        result = 1;
        for (let i = 2; i <= value; i++) result *= i;
      }
      break;
    default: return;
  }
  // Remove floating point residue at exact trigonometric zeros.
  if (['sin', 'cos', 'tan'].includes(name) && Math.abs(result) < 1e-14) result = 0;
  history.textContent = `${name}(${current.replace('.', ',')})${['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].includes(name) ? (degrees ? ' · DEG' : ' · RAD') : ''}`;
  setResult(result);
  fresh = true;
  if (current === 'Error') { previous = null; operator = null; }
}

document.querySelector('#angle-mode').addEventListener('click', event => {
  degrees = !degrees;
  event.currentTarget.textContent = degrees ? 'DEG' : 'RAD';
  event.currentTarget.setAttribute('aria-label', degrees ? 'Modo angular: grados. Cambiar a radianes' : 'Modo angular: radianes. Cambiar a grados');
});

function setResult(value) {
  current = Number.isFinite(value) ? String(Number(value.toPrecision(12))) : 'Error';
}

function inputNumber(number) {
  if (fresh || current === 'Error') { current = '0'; fresh = false; }
  if (current.replace(/[-.]/g, '').length >= 12) return;
  current = current === '0' ? number : current + number;
}

function chooseOperator(next) {
  if (current === 'Error') return;
  if (operator && !fresh) setResult(calculate(previous, Number(current), operator));
  if (current === 'Error') { previous = null; operator = null; history.textContent = ''; return; }
  previous = Number(current);
  operator = next;
  fresh = true;
  history.textContent = `${current.replace('.', ',')} ${symbols[operator]}`;
}

function action(name) {
  if (name === 'clear') {
    current = '0'; previous = null; operator = null; fresh = false; history.textContent = '';
  } else if (name === 'equals' && operator && current !== 'Error') {
    history.textContent = `${String(previous).replace('.', ',')} ${symbols[operator]} ${current.replace('.', ',')} =`;
    setResult(calculate(previous, Number(current), operator));
    previous = null; operator = null; fresh = true;
  } else if (name === 'decimal') {
    if (fresh || current === 'Error') { current = '0'; fresh = false; }
    if (!current.includes('.')) current += '.';
  } else if (name === 'delete') {
    if (fresh || current === 'Error') { current = '0'; fresh = false; }
    else current = current.slice(0, -1) || '0';
    if (current === '-') current = '0';
  } else if (name === 'sign' && current !== 'Error' && Number(current) !== 0) {
    current = current.startsWith('-') ? current.slice(1) : '-' + current;
  } else if (name === 'percent' && current !== 'Error') {
    setResult(Number(current) / 100);
  }
}

document.querySelector('.keys').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.number !== undefined) inputNumber(button.dataset.number);
  else if (button.dataset.function) scientific(button.dataset.function);
  else if (button.dataset.constant) {
    current = String(button.dataset.constant === 'pi' ? Math.PI : Math.E);
    fresh = false;
  }
  else if (button.dataset.operator) chooseOperator(button.dataset.operator);
  else action(button.dataset.action);
  render();
});

document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^[0-9]$/.test(event.key)) inputNumber(event.key);
  else if (['+', '-', '*', '/', '^'].includes(event.key)) chooseOperator(event.key);
  else if (event.key === '.' || event.key === ',') action('decimal');
  else if (event.key === 'Enter' || event.key === '=') action('equals');
  else if (event.key === 'Escape' || event.key === 'Delete') action('clear');
  else if (event.key === 'Backspace') action('delete');
  else if (event.key === '%') action('percent');
  else return;
  event.preventDefault();
  render();
});
