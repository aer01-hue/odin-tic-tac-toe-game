// 1. The Gameboard Module (IIFE): Manages the state of the 3x3 board.
const Gameboard = (function () {
    // Private: The array to store the state of the game board. (0-8 indices).
    let board = ["", "", "", "", "", "", "", "", ""];

// Public method to get a copy of the current board state.
const getBoard = () => [...board];

// Public method to place a mark (X or 0) at a specific index
// Returns true if the move was successful, false otherwise.
const makeMove = (index, mark) => {
    // Ensure the index is valid and the cell is empty
    if (index >= 0 && index < 9 && board[index] === "") {
        board[index] = mark;
        return true;
    }
    return false;
};

// Public method to reset the board for a new game
const resetBoard = () => {
    board = ["", "", "", "", "", "", "", "", ""];
};

//This is the only public interface for the Gameboard module
return {
    getBoard,
    makeMove,
    resetBoard,
};
})();

// 2. Player Factory: Creates player objects.
const createPlayer = (name, mark) => {
    const getMark = () => mark;
    const getName = () => name;
    
    // A player can logically "take a turn" by calling the board's makeMove function.
    // The main GameFlow determines if it's their turn.
    const takeTurn = (index) => {
        return Gameboard.makeMove(index, mark);
    };

    return {
        getName,
        getMark,
        takeTurn,
    };
};

// 3. GameFlow Module (IIFE): Controls the game logic, turns and win conditions.
const GameFlow = (function () {
    // Private: Initialize the players
    const playerX = createPlayer("Player X", "X");
    const playerO = createPlayer("Player O", "O");

    // Private: Game state variables
    let activePlayer = playerX; // Player X starts
    let isGameOver = false;
    
    // Private: All possible winning combinations (indices of the board array)
    const WINNING_COMBOS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6],            // Diagonals
    ];

    // --- Private Helper Functions ---
    // (Ensure playerX and playerO variables are accessible here)

    // Checks the current board state for a win or a tie.
    const checkWin = (board) => {
        const mark = activePlayer.getMark();

        for (const combo of WINNING_COMBOS) {
            // Check if all three cells in the combo match the active player's mark
            if (
                board[combo[0]] === mark &&
                board[combo[1]] === mark &&
                board[combo[2]] === mark
            ) {
                isGameOver = true;
                return {status: `${activePlayer.getName()} wins!`, combo: combo };
            }
        }

        // Check for a Tie: If no win and the board is full (no empty strings)
        if (board.every(cell => cell !== "")) {
            isGameOver = true;
            return { status: "It's a tie!", combo: null };
        }

        return null;  // Game is still ongoing
    };

    // Switches the active player
    const switchPlayer = () => {
        activePlayer = (activePlayer === playerX) ? playerO : playerX;
    };

    // --- Public Game Control Functions ---
        
    const getActivePlayer = () => activePlayer;

    // Core function to execute one turn
    const playTurn = (index) => {
        if (isGameOver) {
            return {status: "Game is over. Please start a new game.", combo: null };
        }

        const moveSuccessful = activePlayer.takeTurn(index);

        if (moveSuccessful) {
            const board = Gameboard.getBoard();
            const gameState = checkWin(board);

            if (gameState) {
                // Game over (Win or Tie)
                return gameState;
            } else {
                // Game continues
                switchPlayer();
                return {status: `${activePlayer.getName()}'s turn.`, combo: null }; 
            }
        } else {
            return { status: "Invalid move. That cell is already taken or out of bounds.", combo: null};
        }
    };

    // Resets the game state and board.
    const resetGame = () => {
        Gameboard.resetBoard();
        activePlayer = playerX;
        isGameOver = false;
        return { status: "Game has been reset. Player X starts.", combo: null };
    };

    // Helper for console testing (optional for final game, but uselful now)
        const printBoard = () => {
            const board = Gameboard.getBoard();
            console.log(`
    ${board[0]} | ${board[1]} | ${board[2]}
    --+---+--
    ${board[3]} | ${board[4]} | ${board[5]}
    --+---+--
    ${board[6]} | ${board[7]} | ${board[8]}
    `);
    
    };

    // Expose the public interface for the game controller
    return {
        playTurn,
        getActivePlayer,
        resetGame,
        printBoard,
        getCurrentBoard: Gameboard.getBoard // Useful for the later DOM manipulation
    };
})();

// 4. DisplayController Module (IIFE)
const DisplayController = (function () {
    const statusMessageElement = document.getElementById('status-message');
    const resetButton = document.getElementById('reset-button');
    const cells = document.querySelectorAll('.cell');

    // --- Private Functions ---

    // Renders the current state of the Gameboard to the DOM
    const renderBoard = () => {
        const boardState = GameFlow.getCurrentBoard();
        cells.forEach((cell, index) => {
            const mark = boardState[index];
            cell.textContent = mark;

            //Clean up old classes and apply the new mark class
            cell.classList.remove('X', 'O', 'win');
            if (mark) {
                cell.classList.add(mark);
            }
        });
    };

    // Updates the game status message
    const setStatusMessage = (message) => {
        statusMessageElement.textContent = (message);
    };

    // Handles a click event on a game cell
    const handleCellClick = (e) => {
        if (!e.target.classList.contains('cell')) return;
        
        const index = parseInt(e.target.dataset.index);
        
        // 1. Call the core game logic function
        const result = GameFlow.playTurn(index);

        // 2. Update the display based on the result
        renderBoard();
        setStatusMessage(result.status);

        // 3. (Future Ready) Highlight the winning combo if the game ended in a win
        if (result.combo) {
            if (Array.isArray(result.combo)) {
                result.combo.forEach(idx => {
                    cells[idx].classList.add('win');
            });
        }
    }
};

    // Initialize all event listeners
    const initializeListeners = () => {
        cells.forEach(cell => {
            cell.addEventListener('click', handleCellClick);
        });

        resetButton.addEventListener('click', () => {
            const result = GameFlow.resetGame();
            renderBoard();
            setStatusMessage(result.status);
        });
    };

    // --- Public Initialization ---

    // Immediately called to set up the game display and listeners
    const init = () => {
        // Initial setup
        initializeListeners();
        // Start the game for the first time
        const initialStatus = GameFlow.resetGame();
        renderBoard();
        setStatusMessage(initialStatus.status);
    };

    return {
        init // Only expose the initialization function
    };
})();

// Start the game when the script loads
DisplayController.init();