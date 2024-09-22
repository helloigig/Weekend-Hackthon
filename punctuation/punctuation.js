const cellSize = 100; // Size of each grid cell
let offsetX = 0;
let offsetY = 0;
let container;
let visibleRows = 0;
let visibleCols = 0;
let fonts = [];
let currentPunctuation; // Declare this at the top of your file

const punctuationMarks = [
    '.', ',', '!', '?', ';', ':', '"', "'", 
    '()', '[]', '{}', 
    '-', '_', '/', '&', '@', '#', '%', '*', '+', '=', '~'
];

// Fetch Google Fonts
async function fetchGoogleFonts() {
    const apiKey = 'AIzaSyA6PZkwawLTmdbkJlovi7bpMobyOUvsmZY';
    try {
        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity&subset=latin&fields=items(family,files)`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching Google Fonts:', error);
        return [];
    }
}

// Initialize the grid and setup the dragging mechanism
async function createPunctuationPage(punctuation) {
    currentPunctuation = punctuation; // Store the punctuation globally
    console.log('Creating page with punctuation:', currentPunctuation);
    container = document.getElementById('grid-container');
    if (!container) {
        console.error('Grid container not found.');
        return;
    }

    fonts = await fetchGoogleFonts();
    setupGridDimensions();
    createGrid();
    setupDraggableCanvas();
}

// Calculate visible rows and columns based on window size
function setupGridDimensions() {
    visibleCols = Math.ceil(window.innerWidth / cellSize) + 2; // Add a buffer for smoothness
    visibleRows = Math.ceil(window.innerHeight / cellSize) + 2;
}

// Create a visible grid with only the cells required to cover the viewport
function createGrid() {
    console.log('Creating grid with punctuation:', currentPunctuation);
    container.innerHTML = ''; // Clear any previous grid
    container.style.position = 'relative';
    container.style.width = `${visibleCols * cellSize}px`;
    container.style.height = `${visibleRows * cellSize}px`;

    const otherPunctuations = punctuationMarks.filter(mark => mark !== currentPunctuation);

    // Generate the visible grid cells
    for (let row = 0; row < visibleRows; row++) {
        for (let col = 0; col < visibleCols; col++) {
            const cell = createCell(row, col, otherPunctuations);
            container.appendChild(cell);
        }
    }
}

// Create individual cells with their content (punctuation and font)
function createCell(row, col, otherPunctuations) {
    console.log('Creating cell with punctuation:', currentPunctuation);
    const fontIndex = (row * visibleCols + col) % fonts.length;
    const font = fonts[fontIndex];
    const isCurrentPunctuation = Math.random() < 0.98; // 98% chance for current punctuation
    const isHomeLink = !isCurrentPunctuation && Math.random() < 0.1; // 10% chance for home link among non-current cells

    const cell = document.createElement('div');
    cell.className = 'punctuation-cell';
    cell.style.position = 'absolute';
    cell.style.width = `${cellSize}px`;
    cell.style.height = `${cellSize}px`;
    cell.style.left = `${col * cellSize}px`;
    cell.style.top = `${row * cellSize}px`;
    cell.setAttribute('data-row', row);
    cell.setAttribute('data-col', col);
    cell.setAttribute('data-font', font.family);

    // Load the font
    const fontUrl = font.files.regular || Object.values(font.files)[0];
    const fontFace = new FontFace(font.family, `url(${fontUrl})`);
    fontFace.load().then(() => {
        document.fonts.add(fontFace);
        cell.style.fontFamily = `'${font.family}', sans-serif`;
    }).catch(err => console.error('Error loading font:', err));

    if (isCurrentPunctuation) {
        cell.innerHTML = `
            <span>${currentPunctuation || 'Error: undefined'}</span>
            <span class="typeface-name" style="display: none;">${font.family}</span>
        `;
        cell.addEventListener('mouseenter', showFontName);
        cell.addEventListener('mouseleave', hideFontName);
    } else if (isHomeLink) {
        cell.innerHTML = `<a href="index.html" style="text-decoration: none; color: inherit;">H</a>`;
    } else {
        const punctuation = otherPunctuations[Math.floor(Math.random() * otherPunctuations.length)];
        cell.innerHTML = `<a href="punctuation.html?mark=${encodeURIComponent(punctuation)}" style="text-decoration: none; color: inherit;">${punctuation}</a>`;
    }

    return cell;
}

// Function to show font name on hover
function showFontName(event) {
    const typefaceName = event.currentTarget.querySelector('.typeface-name');
    if (typefaceName) {
        typefaceName.style.display = 'block';
    }
}

// Function to hide font name when not hovering
function hideFontName(event) {
    const typefaceName = event.currentTarget.querySelector('.typeface-name');
    if (typefaceName) {
        typefaceName.style.display = 'none';
    }
}

// Setup the drag mechanism for infinite grid scrolling
function setupDraggableCanvas() {
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    // Start dragging
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        container.style.cursor = 'grabbing';
    });

    // Dragging behavior
    container.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        offsetX += dx;
        offsetY += dy;

        repositionCells(dx, dy);
        lastX = e.clientX;
        lastY = e.clientY;
    });

    // End dragging
    container.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('mouseleave', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });

    // Adjust the grid on window resize
    window.addEventListener('resize', () => {
        setupGridDimensions();
        createGrid(); // No need to pass currentPunctuation here
    });
}

function repositionCells(deltaX, deltaY) {
    const cells = container.getElementsByClassName('punctuation-cell');

    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        let row = parseInt(cell.getAttribute('data-row'));
        let col = parseInt(cell.getAttribute('data-col'));

        // Calculate the new position of the cell
        let newLeft = parseInt(cell.style.left, 10) + deltaX;
        let newTop = parseInt(cell.style.top, 10) + deltaY;

        // Handle horizontal wrapping for immediate repositioning
        if (newLeft < -cellSize) {
            newLeft += visibleCols * cellSize;
            col = (col + visibleCols) % visibleCols;  // Adjust column index
        } else if (newLeft > window.innerWidth) {
            newLeft -= visibleCols * cellSize;
            col = (col - visibleCols + visibleCols) % visibleCols;
        }

        // Handle vertical wrapping for immediate repositioning
        if (newTop < -cellSize) {
            newTop += visibleRows * cellSize;
            row = (row + visibleRows) % visibleRows;  // Adjust row index
        } else if (newTop > window.innerHeight) {
            newTop -= visibleRows * cellSize;
            row = (row - visibleRows + visibleRows) % visibleRows;
        }

        // Update the cell's position immediately
        cell.style.left = `${newLeft}px`;
        cell.style.top = `${newTop}px`;

        // Update the row and column attributes if the position changed
        cell.setAttribute('data-row', row);
        cell.setAttribute('data-col', col);
    }
}

// Initialize the grid on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const punctuation = urlParams.get('mark');
        console.log('Initial punctuation:', punctuation);

        if (punctuation) {
            createPunctuationPage(punctuation);
        } else {
            console.error('No punctuation mark specified in URL.');
            document.body.innerHTML = '<p>Error: No punctuation mark specified in URL.</p>';
        }
    }, 0);
});
