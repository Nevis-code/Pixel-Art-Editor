const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const basePixelSize = 10; // Taille de base des pixels
let pixelSize = basePixelSize; // Taille actuelle (modifiée par le zoom)
let zoomLevel = 1; // Niveau de zoom (1 = normal)
const gridWidth = 1680 / basePixelSize; // 168 colonnes
const gridHeight = 1050 / basePixelSize; // 105 lignes
const colorPicker = document.getElementById('colorPicker');
const paletteColors = document.getElementById('paletteColors');
const recentColors = document.getElementById('recentColors');
const eraserButton = document.getElementById('eraserButton');
const fillButton = document.getElementById('fillButton');
let isErasing = false; // Mode gomme activé/désactivé
let isFilling = false; // Mode remplir activé/désactivé
let isDrawing = false; // État du clic pour le dessin continu
let recentColorList = []; // Liste des 5 dernières couleurs utilisées

// Tableau pour stocker les couleurs des pixels
const pixelData = Array(gridHeight).fill().map(() => Array(gridWidth).fill(null));

// Palette de couleurs prédéfinies
const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'];

// Dessiner la grille
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ccc'; // Couleur de la grille
    ctx.lineWidth = 0.5;

    // Dessiner les pixels colorés
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (pixelData[y][x]) {
                ctx.fillStyle = pixelData[y][x];
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }

    // Dessiner les lignes de la grille
    for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(canvas.width, y * pixelSize);
        ctx.stroke();
    }
}

// Créer la palette de couleurs prédéfinies
function createPalette() {
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', () => {
            colorPicker.value = color;
            isErasing = false;
            isFilling = false;
            eraserButton.classList.remove('active');
            fillButton.classList.remove('active');
        });
        paletteColors.appendChild(swatch);
    });
}

// Mettre à jour les dernières couleurs utilisées
function updateRecentColors(color) {
    if (color && !recentColorList.includes(color)) {
        recentColorList.unshift(color); // Ajoute au début
        if (recentColorList.length > 5) {
            recentColorList.pop(); // Limite à 5 couleurs
        }
        recentColors.innerHTML = ''; // Vider la palette
        recentColorList.forEach(c => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = c;
            swatch.addEventListener('click', () => {
                colorPicker.value = c;
                isErasing = false;
                isFilling = false;
                eraserButton.classList.remove('active');
                fillButton.classList.remove('active');
            });
            recentColors.appendChild(swatch);
        });
    }
}

// Activer/désactiver la gomme
eraserButton.addEventListener('click', () => {
    isErasing = !isErasing;
    isFilling = false;
    eraserButton.classList.toggle('active', isErasing);
    fillButton.classList.remove('active');
});

// Activer/désactiver le mode remplir
fillButton.addEventListener('click', () => {
    isFilling = !isFilling;
    isErasing = false;
    fillButton.classList.toggle('active', isFilling);
    eraserButton.classList.remove('active');
});

// Algorithme de remplissage par diffusion (flood fill)
function floodFill(startX, startY, fillColor) {
    const targetColor = pixelData[startY][startX];
    if (targetColor === fillColor) return; // Pas besoin de remplir si même couleur

    const stack = [[startX, startY]];
    while (stack.length) {
        const [x, y] = stack.pop();
        if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
        if (pixelData[y][x] !== targetColor) continue;

        pixelData[y][x] = fillColor;
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
    }
    updateRecentColors(fillColor);
    drawGrid();
}

// Fonction pour dessiner, effacer ou remplir
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const gridX = Math.floor(mouseX / pixelSize);
    const gridY = Math.floor(mouseY / pixelSize);

    if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        if (isFilling) {
            floodFill(gridX, gridY, colorPicker.value);
        } else if (isErasing) {
            pixelData[gridY][gridX] = null;
            drawGrid();
        } else {
            pixelData[gridY][gridX] = colorPicker.value;
            updateRecentColors(colorPicker.value);
            drawGrid();
        }
    }
}

// Dessin continu (pour dessin ou gomme)
function handleCanvasMove(e) {
    if (isDrawing && !isFilling) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const gridX = Math.floor(mouseX / pixelSize);
        const gridY = Math.floor(mouseY / pixelSize);

        if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
            pixelData[gridY][gridX] = isErasing ? null : colorPicker.value;
            if (!isErasing) updateRecentColors(colorPicker.value);
            drawGrid();
        }
    }
}

// Début du dessin (clic)
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    handleCanvasClick(e);
});

// Dessin continu (déplacement de la souris)
canvas.addEventListener('mousemove', handleCanvasMove);

// Arrêter le dessin (relâcher le clic)
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Arrêter le dessin si la souris sort du canvas
canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

// Zoom avant
function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.5, 5); // Limite max : x5
    updateZoom();
}

// Zoom arrière
function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.5, 0.5); // Limite min : x0.5
    updateZoom();
}

// Réinitialiser le zoom
function resetZoom() {
    zoomLevel = 1;
    updateZoom();
}

// Mettre à jour le zoom
function updateZoom() {
    pixelSize = basePixelSize * zoomLevel;
    canvas.style.width = `${1680 * zoomLevel}px`;
    canvas.style.height = `${1050 * zoomLevel}px`;
    drawGrid();
}

// Zoom avec la molette
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
});

// Exporter l'image sans la grille
function exportImage() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1680;
    tempCanvas.height = 1050;
    const tempCtx = tempCanvas.getContext('2d');

    // Dessiner uniquement les pixels colorés
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (pixelData[y][x]) {
                tempCtx.fillStyle = pixelData[y][x];
                tempCtx.fillRect(x * basePixelSize, y * basePixelSize, basePixelSize, basePixelSize);
            }
        }
    }

    // Créer un lien pour télécharger l'image
    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

// Initialiser
createPalette();
drawGrid();