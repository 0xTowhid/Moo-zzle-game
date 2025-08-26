// Predefined images array
const IMAGES = [
    'images/lamu1.jpg',
    'images/lamu2.jpeg',
    'images/lamu3.jpeg',
    'images/lamu4.jpeg',
    'images/lamu5.jpeg',
    'images/lamu6.jpeg',
    'images/lamu7.jpeg',
    'images/lamu8.jpeg',
    'images/lamu9.jpeg'
];

class SlidingPuzzle {
    constructor(size = 3) {
        this.size = size;
        this.grid = [];
        this.emptyPos = { row: size - 1, col: size - 1 };
        this.moves = 0;
        this.startTime = 0;
        this.timerInterval = null;
        this.currentImage = this.getRandomImage();
        this.audioContext = null;
        this.isMoving = false; // Prevent multiple moves
        
        this.initAudio();
        this.initializeGame();
    }

    getRandomImage() {
        return IMAGES[Math.floor(Math.random() * IMAGES.length)];
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    playSound(frequency = 800, duration = 100) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }

    initializeGame() {
        this.createGrid();
        this.shuffle();
        this.renderGrid();
        this.startTimer();
    }

    createGrid() {
        this.grid = [];
        for (let i = 0; i < this.size; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                if (i === this.size - 1 && j === this.size - 1) {
                    this.grid[i][j] = 0; // Empty space
                } else {
                    this.grid[i][j] = i * this.size + j + 1;
                }
            }
        }
        // Ensure empty position is set correctly
        this.emptyPos = { row: this.size - 1, col: this.size - 1 };
    }

    renderGrid() {
        const gridElement = document.getElementById('puzzleGrid');
        const containerWidth = Math.min(450, window.innerWidth - 80);
        const tileSize = (containerWidth - 20) / this.size;
        
        gridElement.innerHTML = '';
        gridElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        gridElement.style.width = `${containerWidth}px`;
        gridElement.style.height = `${containerWidth}px`;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'puzzle-tile';
                tile.dataset.row = i;
                tile.dataset.col = j;

                if (this.grid[i][j] === 0) {
                    tile.classList.add('empty');
                } else {
                    const tileNumber = this.grid[i][j] - 1;
                    const tileRow = Math.floor(tileNumber / this.size);
                    const tileCol = tileNumber % this.size;
                    
                    // Since images are 400x400 (square), use simple sizing
                    const totalSize = tileSize * this.size;
                    
                    tile.style.backgroundImage = `url(${this.currentImage})`;
                    tile.style.backgroundPosition = `-${tileCol * tileSize}px -${tileRow * tileSize}px`;
                    tile.style.backgroundSize = `${totalSize}px ${totalSize}px`;
                    tile.style.backgroundRepeat = 'no-repeat';
                    
                    // Only add event listener if this tile can move
                    const canMoveThis = this.canMove(i, j);
                    if (canMoveThis) {
                        tile.style.cursor = 'pointer';
                        tile.style.opacity = '0.9';
                        
                        tile.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!this.isMoving) {
                                this.moveTile(i, j);
                            }
                        });
                    } else {
                        tile.style.cursor = 'default';
                        tile.style.opacity = '1';
                    }
                }

                gridElement.appendChild(tile);
            }
        }
    }

    canMove(row, col) {
        const emptyRow = this.emptyPos.row;
        const emptyCol = this.emptyPos.col;
        
        return (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
               (Math.abs(col - emptyCol) === 1 && row === emptyRow);
    }

    moveTile(row, col) {
        if (!this.canMove(row, col) || this.isMoving) return;

        this.isMoving = true;

        // Swap tiles properly
        const temp = this.grid[this.emptyPos.row][this.emptyPos.col];
        this.grid[this.emptyPos.row][this.emptyPos.col] = this.grid[row][col];
        this.grid[row][col] = temp;
        
        // Update empty position
        this.emptyPos = { row, col };

        this.moves++;
        this.updateMoves();
        this.playSound(600 + Math.random() * 200, 150);
        
        // Re-render the grid
        this.renderGrid();

        setTimeout(() => {
            this.isMoving = false;
            if (this.checkWin()) {
                this.gameWon();
            }
        }, 50);
    }

    shuffle() {
        // Start with solved state
        this.createGrid();
        
        // Perform valid moves only
        for (let i = 0; i < 1000; i++) {
            const possibleMoves = [];
            
            // Check all 4 directions from empty position
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                const newRow = this.emptyPos.row + dr;
                const newCol = this.emptyPos.col + dc;
                
                // Check bounds
                if (newRow >= 0 && newRow < this.size && 
                    newCol >= 0 && newCol < this.size) {
                    possibleMoves.push([newRow, newCol]);
                }
            }
            
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                const [moveRow, moveCol] = randomMove;
                
                // Swap the tile with empty space
                this.grid[this.emptyPos.row][this.emptyPos.col] = this.grid[moveRow][moveCol];
                this.grid[moveRow][moveCol] = 0;
                this.emptyPos = { row: moveRow, col: moveCol };
            }
        }
        
        // Reset moves counter
        this.moves = 0;
        this.updateMoves();
    }

    checkWin() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.size - 1 && j === this.size - 1) {
                    continue;
                }
                if (this.grid[i][j] !== i * this.size + j + 1) {
                    return false;
                }
            }
        }
        return true;
    }

    gameWon() {
        clearInterval(this.timerInterval);
        this.playSound(880, 500);
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        
        setTimeout(() => {
            this.showCompletionScreen(elapsed);
        }, 500);
    }

    showCompletionScreen(elapsed) {
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('completionScreen').style.display = 'block';
        
        const finalImage = document.getElementById('finalImage');
        finalImage.src = this.currentImage;
        
        document.getElementById('finalTime').textContent = `Time: ${this.formatTime(elapsed)}`;
        document.getElementById('finalMoves').textContent = `Moves: ${this.moves}`;
        
        setTimeout(() => {
            finalImage.classList.add('show');
        }, 100);
        
        // Setup share button
        const shareText = `I just solved Moo-zzle game in ${this.formatTime(elapsed)} with ${this.moves} moves. Made with care by @0xTowhid`;
        document.getElementById('shareBtn').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timerDisplay').textContent = ` Time: ${this.formatTime(elapsed)}`;
        }, 1000);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateMoves() {
        document.getElementById('movesDisplay').textContent = ` Moves: ${this.moves}`;
    }

    showHint() {
        document.getElementById('hintImage').src = this.currentImage;
        document.getElementById('hintModal').style.display = 'flex';
    }

    newGame() {
        clearInterval(this.timerInterval);
        this.isMoving = false; // Reset movement flag
        this.currentImage = this.getRandomImage();
        this.initializeGame();
    }
}

let currentPuzzle = null;
let selectedSize = 5;

// Start screen event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.difficulty-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            selectedSize = parseInt(btn.dataset.size);
        });
    });

    // Start game
    document.getElementById('startGameBtn').addEventListener('click', () => {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        currentPuzzle = new SlidingPuzzle(selectedSize);
    });

    // Game controls
    document.getElementById('hintBtn').addEventListener('click', () => {
        if (currentPuzzle) currentPuzzle.showHint();
    });

    document.getElementById('newGameBtn').addEventListener('click', () => {
        if (currentPuzzle) currentPuzzle.newGame();
    });

    document.getElementById('playAgainBtn').addEventListener('click', () => {
        document.getElementById('completionScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'block';
        document.getElementById('finalImage').classList.remove('show');
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!currentPuzzle || 
            document.getElementById('gameScreen').style.display === 'none' ||
            currentPuzzle.isMoving) return;
        
        const emptyRow = currentPuzzle.emptyPos.row;
        const emptyCol = currentPuzzle.emptyPos.col;
        let targetRow = emptyRow;
        let targetCol = emptyCol;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                targetRow = emptyRow + 1;
                break;
            case 'ArrowDown':
                e.preventDefault();
                targetRow = emptyRow - 1;
                break;
            case 'ArrowLeft':
                e.preventDefault();
                targetCol = emptyCol + 1;
                break;
            case 'ArrowRight':
                e.preventDefault();
                targetCol = emptyCol - 1;
                break;
            default:
                return;
        }
        
        if (targetRow >= 0 && targetRow < currentPuzzle.size && 
            targetCol >= 0 && targetCol < currentPuzzle.size) {
            currentPuzzle.moveTile(targetRow, targetCol);
        }
    });
});

function closeHint() {
    document.getElementById('hintModal').style.display = 'none';
}

// Enable audio on first user interaction
document.addEventListener('click', () => {
    if (currentPuzzle && currentPuzzle.audioContext && currentPuzzle.audioContext.state === 'suspended') {
        currentPuzzle.audioContext.resume();
    }
}, { once: true });