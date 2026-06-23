// Math Core: Modular Linear Algebra (Hill Cipher 4x4)
const MODULO = 26;
const MATRIX_SIZE = 4;

// Default invertible key matrix (from HillCipher.java)
const DEFAULT_KEY = [
  [6, 24, 1, 13],
  [20, 17, 15, 23],
  [17, 14, 23, 14],
  [17, 20, 17, 1]
];

// Inverted key storage
let currentKeyMatrix = JSON.parse(JSON.stringify(DEFAULT_KEY));
let currentInverseMatrix = null;
let matrixStatus = {
  isValid: true,
  determinant: 0,
  modInverse: 0,
  reason: ""
};

// --- Matrix Mathematical Operations ---

function getGCD(a, b) {
  while (b) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function getModularMultiplicativeInverse(det, m) {
  det = ((det % m) + m) % m;
  for (let i = 1; i < m; i++) {
    if ((det * i) % m === 1) {
      return i;
    }
  }
  return null;
}

// 3x3 Determinant helper
function get3x3Determinant(m) {
  return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
         m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
         m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
}

// Get 3x3 submatrix by deleting specified row and column
function getSubmatrix(matrix, row, col) {
  let sub = [];
  for (let i = 0; i < matrix.length; i++) {
    if (i === row) continue;
    let subRow = [];
    for (let j = 0; j < matrix[i].length; j++) {
      if (j === col) continue;
      subRow.push(matrix[i][j]);
    }
    sub.push(subRow);
  }
  return sub;
}

// 4x4 Determinant calculation
function get4x4Determinant(matrix) {
  let det = 0;
  for (let j = 0; j < MATRIX_SIZE; j++) {
    let sub = getSubmatrix(matrix, 0, j);
    let subDet = get3x3Determinant(sub);
    let term = matrix[0][j] * subDet;
    if (j % 2 === 1) {
      det -= term;
    } else {
      det += term;
    }
  }
  return ((det % MODULO) + MODULO) % MODULO;
}

// Calculate Cofactor Matrix
function calculateCofactorMatrix(matrix) {
  let cofactor = [];
  for (let i = 0; i < MATRIX_SIZE; i++) {
    let row = [];
    for (let j = 0; j < MATRIX_SIZE; j++) {
      let sub = getSubmatrix(matrix, i, j);
      let subDet = get3x3Determinant(sub);
      let sign = ((i + j) % 2 === 0) ? 1 : -1;
      let val = ((sign * subDet % MODULO) + MODULO) % MODULO;
      row.push(val);
    }
    cofactor.push(row);
  }
  return cofactor;
}

// Transpose Matrix (Adjugate)
function transpose(matrix) {
  let transposed = [];
  for (let j = 0; j < MATRIX_SIZE; j++) {
    let row = [];
    for (let i = 0; i < MATRIX_SIZE; i++) {
      row.push(matrix[i][j]);
    }
    transposed.push(row);
  }
  return transposed;
}

// Invert 4x4 matrix modulo 26
function invertMatrix(matrix) {
  let det = get4x4Determinant(matrix);
  if (det === 0) {
    return { success: false, reason: "Determinant is 0. Matrix is singular." };
  }
  
  let gcd = getGCD(det, MODULO);
  if (gcd !== 1) {
    return { 
      success: false, 
      reason: `Determinant (det = ${det}) has common factor with 26 (gcd = ${gcd}). Not modularly invertible.` 
    };
  }

  let modInverse = getModularMultiplicativeInverse(det, MODULO);
  if (!modInverse) {
    return { success: false, reason: "No modular multiplicative inverse found." };
  }

  let cofactor = calculateCofactorMatrix(matrix);
  let adjugate = transpose(cofactor);
  
  let inverse = [];
  for (let i = 0; i < MATRIX_SIZE; i++) {
    let row = [];
    for (let j = 0; j < MATRIX_SIZE; j++) {
      let val = (adjugate[i][j] * modInverse) % MODULO;
      row.push(val);
    }
    inverse.push(row);
  }

  return {
    success: true,
    inverse: inverse,
    determinant: det,
    modInverse: modInverse,
    cofactor: cofactor,
    adjugate: adjugate
  };
}

// --- Encryption & Decryption Core ---

function processText(text, matrix) {
  // Convert to clean uppercase input, stripping non-alphabetic
  let cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  
  // Pad with 'X' to match matrix size
  let paddingCount = 0;
  while (cleanText.length % MATRIX_SIZE !== 0) {
    cleanText += "X";
    paddingCount++;
  }

  let resultText = "";
  let steps = [];

  for (let blockIndex = 0; blockIndex < cleanText.length; blockIndex += MATRIX_SIZE) {
    let vector = [];
    for (let k = 0; k < MATRIX_SIZE; k++) {
      vector.push(cleanText.charCodeAt(blockIndex + k) - 65); // 'A' -> 0
    }

    let outVector = [];
    let blockFormula = [];
    for (let i = 0; i < MATRIX_SIZE; i++) {
      let sum = 0;
      let multiplyTerms = [];
      for (let j = 0; j < MATRIX_SIZE; j++) {
        let term = matrix[i][j] * vector[j];
        sum += term;
        multiplyTerms.push(`${matrix[i][j]}×${vector[j]}`);
      }
      let moddedValue = sum % MODULO;
      outVector.push(moddedValue);
      resultText += String.fromCharCode(moddedValue + 65);
      
      blockFormula.push({
        row: i,
        terms: multiplyTerms.join(" + "),
        sum: sum,
        result: moddedValue,
        char: String.fromCharCode(moddedValue + 65)
      });
    }

    steps.push({
      inputBlock: cleanText.substring(blockIndex, blockIndex + MATRIX_SIZE),
      inputVector: vector,
      formulas: blockFormula,
      outputBlock: resultText.substring(blockIndex, blockIndex + MATRIX_SIZE)
    });
  }

  return {
    output: resultText,
    paddedLength: cleanText.length,
    paddingAdded: paddingCount,
    steps: steps
  };
}

// --- DOM Orchestration & Interactions ---

function getMatrixFromDOM() {
  let mat = [];
  for (let i = 0; i < MATRIX_SIZE; i++) {
    let row = [];
    for (let j = 0; j < MATRIX_SIZE; j++) {
      let val = parseInt(document.getElementById(`cell-${i}-${j}`).value) || 0;
      row.push(val);
    }
    mat.push(row);
  }
  return mat;
}

function updateMatrixStatus() {
  const matrix = getMatrixFromDOM();
  currentKeyMatrix = matrix;
  
  const result = invertMatrix(matrix);
  const statusEl = document.getElementById("matrix-status-badge");
  const reasonEl = document.getElementById("matrix-status-reason");
  const mathTraceEl = document.getElementById("math-trace-content");
  
  if (result.success) {
    currentInverseMatrix = result.inverse;
    matrixStatus.isValid = true;
    matrixStatus.determinant = result.determinant;
    matrixStatus.modInverse = result.modInverse;
    
    statusEl.className = "px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5";
    statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> INVERTIBLE`;
    reasonEl.className = "text-xs text-emerald-400/80 mt-1 font-mono";
    reasonEl.textContent = `Det: ${result.determinant} | Det⁻¹ mod 26: ${result.modInverse}`;

    // Fill Inverse Matrix View
    for (let i = 0; i < MATRIX_SIZE; i++) {
      for (let j = 0; j < MATRIX_SIZE; j++) {
        document.getElementById(`inv-cell-${i}-${j}`).textContent = result.inverse[i][j];
      }
    }
    document.getElementById("inverse-matrix-container").classList.remove("opacity-50");
    
    // Render Step-by-Step Math Inversion Trace
    mathTraceEl.innerHTML = `
      <div class="space-y-4 text-sm font-mono leading-relaxed">
        <div class="step-container relative step-active">
          <div class="step-dot"></div>
          <span class="text-cyan-400 font-semibold">Step 1: Calculate Determinant</span>
          <p class="text-xs text-gray-400 mt-1">Expanding along Row 1 of Key Matrix:</p>
          <div class="bg-zinc-900/40 p-2.5 rounded border border-zinc-800 mt-1.5 text-xs text-gray-300">
            det(K) = ${matrix[0][0]}×|M₀₀| - ${matrix[0][1]}×|M₀₁| + ${matrix[0][2]}×|M₀₂| - ${matrix[0][3]}×|M₀₃|<br>
            det(K) = ${result.determinant} mod 26
          </div>
        </div>
        
        <div class="step-container relative step-active">
          <div class="step-dot"></div>
          <span class="text-cyan-400 font-semibold">Step 2: Modular Multiplicative Inverse</span>
          <p class="text-xs text-gray-400 mt-1">Solve for d⁻¹ where (det(K) × d⁻¹) ≡ 1 mod 26:</p>
          <div class="bg-zinc-900/40 p-2.5 rounded border border-zinc-800 mt-1.5 text-xs text-gray-300">
            (${result.determinant} × ${result.modInverse}) ≡ ${ (result.determinant * result.modInverse) } ≡ 1 mod 26<br>
            d⁻¹ = <span class="text-emerald-400 font-semibold">${result.modInverse}</span>
          </div>
        </div>
        
        <div class="step-container relative step-active">
          <div class="step-dot"></div>
          <span class="text-cyan-400 font-semibold">Step 3: Cofactor & Adjugate Matrices</span>
          <p class="text-xs text-gray-400 mt-1">Compute cofactors and transpose the matrix to form adj(K):</p>
          <div class="grid grid-cols-2 gap-2 mt-1.5 text-xs">
            <div class="bg-zinc-900/40 p-2 rounded border border-zinc-800 text-gray-300">
              <span class="text-gray-500 block mb-1">Cofactor Matrix:</span>
              ${result.cofactor.map(row => `[ ${row.join(", ")} ]`).join("<br>")}
            </div>
            <div class="bg-zinc-900/40 p-2 rounded border border-zinc-800 text-gray-300">
              <span class="text-gray-500 block mb-1">Adjugate Matrix (transposed):</span>
              ${result.adjugate.map(row => `[ ${row.join(", ")} ]`).join("<br>")}
            </div>
          </div>
        </div>
        
        <div class="step-container relative step-active">
          <div class="step-dot"></div>
          <span class="text-cyan-400 font-semibold">Step 4: Final Modular Inverse Matrix</span>
          <p class="text-xs text-gray-400 mt-1">Multiply adj(K) by d⁻¹ modulo 26:</p>
          <div class="bg-zinc-900/40 p-2.5 rounded border border-zinc-800 mt-1.5 text-xs text-emerald-400 font-semibold">
            K⁻¹ = (${result.modInverse} × adj(K)) mod 26
          </div>
        </div>
      </div>
    `;
  } else {
    matrixStatus.isValid = false;
    statusEl.className = "px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5";
    statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> INVALID KEY`;
    reasonEl.className = "text-xs text-rose-400/80 mt-1 font-mono";
    reasonEl.textContent = result.reason;

    document.getElementById("inverse-matrix-container").classList.add("opacity-50");
    mathTraceEl.innerHTML = `
      <div class="text-center py-6 text-gray-500 font-mono text-sm">
        <svg class="w-8 h-8 mx-auto text-rose-500/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>Cannot trace inversion process. Key matrix is singular or determinant has common factors with 26.</span>
      </div>
    `;
  }
  
  // Trigger enc/dec recalculation
  handleEncryptionInput();
  handleDecryptionInput();
}

// --- Input handlers & Step visualization ---

function handleEncryptionInput() {
  const text = document.getElementById("encrypt-input").value;
  const resultContainer = document.getElementById("encrypt-result-container");
  const textOutput = document.getElementById("encrypt-output");
  const stepContainer = document.getElementById("encrypt-steps");
  
  if (!matrixStatus.isValid) {
    resultContainer.classList.add("hidden");
    return;
  }
  
  if (!text.trim()) {
    resultContainer.classList.add("hidden");
    return;
  }
  
  resultContainer.classList.remove("hidden");
  const result = processText(text, currentKeyMatrix);
  textOutput.value = result.output;
  
  // Render step-by-step calculations
  let html = "";
  result.steps.forEach((step, blockIdx) => {
    html += `
      <div class="border-b border-zinc-800/80 pb-4 mb-4 last:border-0 last:pb-0 font-mono">
        <div class="flex justify-between text-xs text-gray-500 mb-2">
          <span>Block ${blockIdx + 1}: <strong class="text-cyan-400">${step.inputBlock}</strong></span>
          <span>Vector P = [ ${step.inputVector.join(", ")} ]</span>
        </div>
        <div class="space-y-1.5">
    `;
    
    step.formulas.forEach((f, idx) => {
      html += `
        <div class="flex flex-col sm:flex-row justify-between text-xs gap-1">
          <div class="text-gray-300">
            C<sub>${idx}</sub> = [ ${f.terms} ] mod 26
          </div>
          <div class="text-emerald-400 font-semibold self-end">
            = ${f.sum} ≡ ${f.result} (char '${f.char}')
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="text-xs text-cyan-400 mt-2 text-right">
          Result Block: <strong>${step.outputBlock}</strong>
        </div>
      </div>
    `;
  });
  
  stepContainer.innerHTML = html;
}

function handleDecryptionInput() {
  const text = document.getElementById("decrypt-input").value;
  const resultContainer = document.getElementById("decrypt-result-container");
  const textOutput = document.getElementById("decrypt-output");
  const stepContainer = document.getElementById("decrypt-steps");
  
  if (!matrixStatus.isValid || !currentInverseMatrix) {
    resultContainer.classList.add("hidden");
    return;
  }
  
  if (!text.trim()) {
    resultContainer.classList.add("hidden");
    return;
  }
  
  resultContainer.classList.remove("hidden");
  const result = processText(text, currentInverseMatrix);
  textOutput.value = result.output;
  
  // Render step-by-step calculations
  let html = "";
  result.steps.forEach((step, blockIdx) => {
    html += `
      <div class="border-b border-zinc-800/80 pb-4 mb-4 last:border-0 last:pb-0 font-mono">
        <div class="flex justify-between text-xs text-gray-500 mb-2">
          <span>Block ${blockIdx + 1}: <strong class="text-cyan-400">${step.inputBlock}</strong></span>
          <span>Vector C = [ ${step.inputVector.join(", ")} ]</span>
        </div>
        <div class="space-y-1.5">
    `;
    
    step.formulas.forEach((f, idx) => {
      html += `
        <div class="flex flex-col sm:flex-row justify-between text-xs gap-1">
          <div class="text-gray-300">
            P<sub>${idx}</sub> = [ ${f.terms} ] mod 26
          </div>
          <div class="text-emerald-400 font-semibold self-end">
            = ${f.sum} ≡ ${f.result} (char '${f.char}')
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="text-xs text-cyan-400 mt-2 text-right">
          Result Block: <strong>${step.outputBlock}</strong>
        </div>
      </div>
    `;
  });
  
  stepContainer.innerHTML = html;
}

// Preset Keys Loader
function loadPresetKey(presetIndex) {
  let preset;
  switch (presetIndex) {
    case 0:
      preset = DEFAULT_KEY;
      break;
    case 1:
      preset = [
        [3, 10, 20, 0],
        [15, 9, 19, 17],
        [2, 8, 11, 4],
        [5, 21, 6, 12]
      ];
      break;
    case 2:
      // Non-invertible key
      preset = [
        [1, 2, 3, 4],
        [4, 3, 2, 1],
        [1, 1, 1, 1],
        [2, 2, 2, 2]
      ];
      break;
  }
  
  for (let i = 0; i < MATRIX_SIZE; i++) {
    for (let j = 0; j < MATRIX_SIZE; j++) {
      document.getElementById(`cell-${i}-${j}`).value = preset[i][j];
    }
  }
  updateMatrixStatus();
}



// Copy to clipboard with success indicator animation
function copyOutput(elementId, buttonId) {
  const inputEl = document.getElementById(elementId);
  const btnEl = document.getElementById(buttonId);
  if (!inputEl || !btnEl || !inputEl.value) return;

  navigator.clipboard.writeText(inputEl.value).then(() => {
    btnEl.classList.add("copied");
    const originalSVG = btnEl.innerHTML;
    btnEl.innerHTML = `
      <svg class="w-4 h-4 text-emerald-400 animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    `;
    setTimeout(() => {
      btnEl.classList.remove("copied");
      btnEl.innerHTML = originalSVG;
    }, 2000);
  }).catch(err => {
    console.error("Failed to copy text: ", err);
  });
}

// Interactive highlighting of matrix row and col on input focus
function highlightMatrixPath(rowIdx, colIdx, highlight) {
  for (let i = 0; i < MATRIX_SIZE; i++) {
    const rowEl = document.getElementById(`cell-${rowIdx}-${i}`);
    if (rowEl) {
      if (highlight) rowEl.classList.add("active-row");
      else rowEl.classList.remove("active-row");
    }
    const colEl = document.getElementById(`cell-${i}-${colIdx}`);
    if (colEl) {
      if (highlight) colEl.classList.add("active-col");
      else colEl.classList.remove("active-col");
    }
  }
}

// Initial setups on load
window.addEventListener("DOMContentLoaded", () => {
  // Bind inputs
  for (let i = 0; i < MATRIX_SIZE; i++) {
    for (let j = 0; j < MATRIX_SIZE; j++) {
      const el = document.getElementById(`cell-${i}-${j}`);
      el.addEventListener("input", updateMatrixStatus);
      
      // Bind hover/focus highlighting
      el.addEventListener("focus", () => highlightMatrixPath(i, j, true));
      el.addEventListener("blur", () => highlightMatrixPath(i, j, false));
    }
  }
  
  document.getElementById("encrypt-input").addEventListener("input", handleEncryptionInput);
  document.getElementById("decrypt-input").addEventListener("input", handleDecryptionInput);

  // Setup presets
  loadPresetKey(0);
});
