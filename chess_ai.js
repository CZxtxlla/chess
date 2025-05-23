function makeRandomMove() {
    if (chess.game_over()) {
        alert("Game over!");
        return;
    }

    const moves = chess.moves();
    const move = moves[Math.floor(Math.random() * moves.length)];
    chess.move(move);
    board.position(chess.fen());

}

// Function to evaluate the board position
function evaluateBoard() {
    const pieceValues = {
        'p': 1,
        'r': 5,
        'n': 3,
        'b': 3,
        'q': 9,
        'k': 0
    };

    let totalValue = 0;

    const board = chess.board(); // 2D array: 8 rows of 8 squares
    for (let row of board) {
        for (let square of row) {
            if (square) {
                const pieceValue = pieceValues[square.type] * (square.color === 'w' ? 1 : -1);
                totalValue += pieceValue;
            }
        }
    }

    return totalValue;
}

function minimax(depth, alpha, beta, maximizing) {
    if (depth == 0 || chess.game_over()) {
        if (chess.in_checkmate()) {
            return maximizing ? -Infinity : Infinity;
        } else if (chess.in_draw()) {
            return 0;
        } else {
            return evaluateBoard();
        }
    } 

    if (maximizing) {
        let maxEval = -Infinity;
        const moves = chess.moves();

        for (let move of moves) {
            chess.move(move);
            const eval = minimax(depth - 1, alpha, beta, false);
            chess.undo();
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                break; // Alpha-beta cutoff
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        const moves = chess.moves();

        for (let move of moves) {
            chess.move(move);
            const eval = minimax(depth - 1, alpha, beta, true);
            chess.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                break; // Alpha-beta cutoff
            }
        }
        return minEval;
    }
}


function getBestMove(depth = 3) {
    const moves = chess.moves();
    let bestMove = null;
    let bestValue = Infinity;

    for (let move of moves) {
        chess.move(move);
        const moveValue = minimax(depth - 1, -Infinity, Infinity, true);
        chess.undo();

        if (moveValue < bestValue) {
            bestValue = moveValue;
            bestMove = move;
        }
    }
    console.log(`Best move: ${bestMove}, Value: ${bestValue}`);
    return bestMove;
}

function makeBestMove() {
    if (chess.game_over()) {
        alert("Game over!");
        return;
    }

    const bestMove = getBestMove();
    chess.move(bestMove);
    board.position(chess.fen());
}