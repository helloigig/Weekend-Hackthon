const punctuationMarks = [
    '.', ',', '!', '?', ';', ':', '"', "'", 
    '()', '[]', '{}', 
    '-', '_', '/', '&', '@', '#', '%', '*', '+', '=', '~'
];

let fonts = [];

async function fetchGoogleFonts() {
    const apiKey = 'AIzaSyA6PZkwawLTmdbkJlovi7bpMobyOUvsmZY';
    try {
        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching Google Fonts:', error);
        return [];
    }
}

async function createHomePage() {
    const container = document.getElementById('grid-container');
    if (!container) {
        console.error('Grid container not found');
        return;
    }
    container.innerHTML = '';
    
    fonts = await fetchGoogleFonts();
    if (fonts.length === 0) {
        container.innerHTML = '<p>Error: Unable to load fonts. Please try again later.</p>';
        return;
    }

    const gridSize = 10; // 10x10 grid

    // Create all grid cells first
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'gallery-item';
        container.appendChild(cell);
    }

    // Shuffle cell indices
    const cellIndices = Array.from({length: gridSize * gridSize}, (_, i) => i);
    for (let i = cellIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
    }

    // Use only as many positions as there are punctuation marks
    const usedIndices = cellIndices.slice(0, punctuationMarks.length);

    punctuationMarks.forEach((mark, index) => {
        const cellIndex = usedIndices[index];
        const cell = container.children[cellIndex];
        cell.className = 'punctuation-cell';
        
        const font = fonts[index % fonts.length];
        cell.innerHTML = `
            <span style="font-family: '${font.family}', sans-serif;">${mark}</span>
            <span class="typeface-name">${font.family}</span>
        `;
        
        cell.addEventListener('click', () => {
            window.location.href = `punctuation.html?mark=${encodeURIComponent(mark)}`;
        });
    });
    setupDraggableCanvas(container);
}

function setupDraggableCanvas(container) {
    let isDragging = false;
    let startX, startY;

    container.addEventListener('mousedown', startDragging);
    container.addEventListener('mousemove', drag);
    container.addEventListener('mouseup', stopDragging);
    container.addEventListener('mouseleave', stopDragging);

    function startDragging(e) {
        isDragging = true;
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX);
        const walkY = (y - startY);
        container.scrollLeft -= walkX;
        container.scrollTop -= walkY;
        startX = x;
        startY = y;
    }

    function stopDragging() {
        isDragging = false;
    }
}

// Call createHomePage when the DOM is loaded
document.addEventListener('DOMContentLoaded', createHomePage);

