// Chess AI using Minimax with Alpha-Beta Pruning

//piece square tables

const pieceSquareTables = {
    'p' : [0,  0,  0,  0,  0,  0,  0,  0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5,  5, 10, 25, 25, 10,  5,  5,
        0,  0,  0, 20, 20,  0,  0,  0,
        5, -5,-10,  0,  0,-10, -5,  5,
        5, 10, 10,-20,-20, 10, 10,  5,
        0,  0,  0,  0,  0,  0,  0,  0],

    'n' : [-50,-40,-30,-30,-30,-30,-40,-50,
        -40,-20,  0,  0,  0,  0,-20,-40,
        -30,  0, 10, 15, 15, 10,  0,-30,
        -30,  5, 15, 20, 20, 15,  5,-30,
        -30,  0, 15, 20, 20, 15,  0,-30,
        -30,  5, 10, 15, 15, 10,  5,-30,
        -40,-20,  0,  5,  5,  0,-20,-40,
        -50,-40,-30,-30,-30,-30,-40,-50],
    
    'b' : [-20,-10,-10,-10,-10,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5, 10, 10,  5,  0,-10,
        -10,  5,  5, 10, 10,  5,  5,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10, 10, 10, 10, 10, 10, 10,-10,
        -10,  5,  0,  0,  0,  0,  5,-10,
        -20,-10,-10,-10,-10,-10,-10,-20],

    'r' : [0,  0,  0,  0,  0,  0,  0,  0,
        5, 10, 10, 10, 10, 10, 10,  5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        0,  0,  0,  5,  5,  0,  0,  0],

    'q' : [-20,-10,-10, -5, -5,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5,  5,  5,  5,  0,-10,
         -5,  0,  5,  5,  5,  5,  0, -5,
          0,  0,  5,  5,  5,  5,  0, -5,
        -10,  5,  5,  5,  5,  5,  0,-10,
        -10,  0,  5,  0,  0,  0,  0,-10,
        -20,-10,-10, -5, -5,-10,-10,-20],
    
    'k' : [-30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -20,-30,-30,-40,-40,-30,-30,-20,
        -10,-20,-20,-20,-20,-20,-20,-10,
         20, 20,  0,  0,  0,  0, 20, 20,
         20, 30, 10,  0,  0, 10, 30, 20],
    
    'k end' : [
        -50,-40,-30,-20,-20,-30,-40,-50,
        -30,-20,-10,  0,  0,-10,-20,-30,
        -30,-10, 20, 30, 30, 20,-10,-30,
        -30,-10, 30, 40, 40, 30,-10,-30,
        -30,-10, 30, 40, 40, 30,-10,-30,
        -30,-10, 20, 30, 30, 20,-10,-30,
        -30,-30,  0,  0,  0,  0,-30,-30,
        -50,-30,-30,-30,-30,-30,-30,-50]
    
};

function squareToIndex(square) {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // a=0, b=1, ..., h=7
    const rank = 8 - parseInt(square[1]); // 1=7, 2=6, ..., 8=0
    return rank * 8 + file; // 0–63
}

function indexToSquare(index) {
    const file = String.fromCharCode('a'.charCodeAt(0) + (index % 8));
    const rank = 8 - Math.floor(index / 8);
    return file + rank;
}

function pieceSquareValue(piece, square, color) {
    //console.log(`piece: ${piece}, square: ${square}, color: ${color}`);
    const pieceType = piece.toLowerCase();
    const squareIndex = squareToIndex(square);
    let index = squareIndex;

    if (color === 'b') {
        const row = Math.floor(squareIndex / 8);
        const col = squareIndex % 8;
        index = (7 - row) * 8 + col;
    }
    //console.log(pieceType);
    //console.log(index);
    let value = pieceSquareTables[pieceType][index];
    //console.log(value);

    // Adjust for endgame
    if (pieceType === 'k' && chess.game_over()) {
        value = pieceSquareTables['k end'][index];
    }

    return color === 'w' ? value : -value; // positive for white, negative for black
}

function isSquareAttackedByPawn(square, byColor) {
    const index = squareToIndex(square);
    const row = Math.floor(index / 8);
    const col = index % 8;
    const directions = [];

    if (byColor === 'w') {
        if (row > 0 && col > 0) directions.push([row - 1, col - 1]);
        if (row > 0 && col < 7) directions.push([row - 1, col + 1]);
    } else {
        if (row < 7 && col > 0) directions.push([row + 1, col - 1]);
        if (row < 7 && col < 7) directions.push([row + 1, col + 1]);
    }

    for (const [r, c] of directions) {
        const s = indexToSquare(r * 8 + c);
        const piece = chess.get(s);
        if (piece && piece.type === 'p' && piece.color === byColor) {
            return true;
        }
    }

    return false;
}


function orderMoves(moves) {
    const pieceValues = {
        'p': 100,
        'n': 320,
        'b': 330,
        'r': 500,
        'q': 900,
        'k': 0
    };

    const color = chess.turn();

    function moveValue(move) {
        let score = 0;

        if (move.captured) {
            score += 10 * (pieceValues[move.captured] - pieceValues[move.piece]);
        }

        if (move.promotion) {
            score += pieceValues[move.promotion];
        }
        //console.log(move.to)
        if (isSquareAttackedByPawn(move.to, color === 'w' ? 'b' : 'w')) {
            score -= pieceValues[move.piece];
        }

        return score;
    }

    return moves.sort((a, b) => moveValue(b) - moveValue(a)); // Sort in descending order
}

// Function to evaluate the board position
function evaluateBoard() {
    const pieceValues = {
        'p': 100,
        'r': 500,
        'n': 320,
        'b': 330,
        'q': 900,
        'k': 0
    };

    if (chess.in_checkmate()) {
        return chess.turn() === 'w' ? -Infinity : Infinity;
    } else if (chess.in_draw()) {
        return 0;
    }

    let totalValue = 0;

    const board = chess.board(); // 2D array: 8 rows of 8 squares
    let rank = 0;
    for (let row of board) {
        let file = 0;
        for (let square of row) {
            if (square) {
                const pieceValue = pieceValues[square.type] * (square.color === 'w' ? 1 : -1);
                totalValue += pieceValue;
                
                const squareName = String.fromCharCode('a'.charCodeAt(0) + rank) + (8 - file);
                const psqValue = pieceSquareValue(square.type, squareName, square.color);
                totalValue += psqValue * (square.color === 'w' ? 1 : -1);
            }
            file++;
        }
        rank++;
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
            // Evaluate the board position
            const evaluation = evaluateBoard();
            //console.log(`Evaluation at depth ${depth}: ${evaluation}`);
            return evaluation;
        }
    } 

    if (maximizing) {
        let maxEval = -Infinity;
        const moves = chess.moves({ verbose: true });
        const orderedMoves = orderMoves(moves);

        for (let move of orderedMoves) {
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
        const moves = chess.moves({ verbose: true });
        const orderedMoves = orderMoves(moves);

        for (let move of orderedMoves) {
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
    const moves = chess.moves({ verbose: true });
    const orderedMoves = orderMoves(moves);
    let bestMove = null;
    let bestValue = Infinity;

    for (let move of orderedMoves) {
        chess.move(move);
        const moveValue = minimax(depth - 1, -Infinity, Infinity, true);
        chess.undo();

        if (moveValue < bestValue) {
            bestValue = moveValue;
            bestMove = move;
        }
    }
    console.log(`Best move: ${bestMove.san}, Value: ${bestValue}`);
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