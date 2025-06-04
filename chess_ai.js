// Chess AI using Minimax with Alpha-Beta Pruning

let minimaxCalls = 0;
let transpositions = 0;
let transpositionTable = {};

function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
    }
    return hash >>> 0; // unsigned 32-bit
}

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

function pieceSquareValue(piece, square, color, weight) {
    //console.log(`piece: ${piece}, square: ${square}, color: ${color}`);
    const pieceType = piece.toLowerCase();
    const squareIndex = squareToIndex(square);
    let index = squareIndex;

    if (color === 'b') {
        const row = Math.floor(squareIndex / 8);
        const col = squareIndex % 8;
        index = (7 - row) * 8 + col;
    }

    let value = pieceSquareTables[pieceType][index];

    // Adjust for endgame
    if (pieceType === 'p' && weight > 0.7) {
        value *= 2;
    } else if (pieceType === 'k' && weight > 1.3) {
        value = 0.25 * pieceSquareTables['k end'][index];
    } else if (pieceType === 'k' && weight > 0.9) {
        value = 0.5 * pieceSquareTables['k end'][index];
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

function endgameWeight() {
    const board = chess.board();
    let queenCount = 0;
    let nonPawnPieceCount = 0;

    for (let row of board) {
        for (let square of row) {
            if (square) {
                if (square.type === 'q') {
                    queenCount++;
                } else if (square.type !== 'p') {
                    nonPawnPieceCount++;
                }
            }
        }
    }
    if (nonPawnPieceCount <= 5 && queenCount === 0) {
        return 2; // king and pawn endgame
    } else if ((nonPawnPieceCount <= 8 && queenCount == 0) || (nonPawnPieceCount <= 6)) {
        return 1; // endgame
    } else if (nonPawnPieceCount <= 10) {
        return 0.5; // middlegame
    } else {
        return 0; // opening
    }
}

function forceKingToCornerEndgame(weight) {
    const board = chess.board();
    let opponentKingPos = null;
    let friendlyKingPos = null;

    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            const square = board[rank][file];
            if (square && square.type === 'k') {
                if (square.color === 'w') {
                    friendlyKingPos = [rank, file];
                } else {
                    opponentKingPos = [rank, file];
                }
            }
        }
    }

    if (!opponentKingPos || !friendlyKingPos) return 0;

    const opIdx = opponentKingPos[0] * 8 + opponentKingPos[1];
    const frIdx = friendlyKingPos[0] * 8 + friendlyKingPos[1];
    const opponentKingSquare = indexToSquare(opIdx);
    const friendlyKingSquare = indexToSquare(frIdx);

    const opponentKingDistToCentre =
        Math.abs(opponentKingSquare.charCodeAt(0) - 'd'.charCodeAt(0)) +
        Math.abs(opponentKingSquare[1] - '4');

    let evaluation = opponentKingDistToCentre;

    const distBetweenKings =
        Math.abs(friendlyKingSquare.charCodeAt(0) - opponentKingSquare.charCodeAt(0)) +
        Math.abs(friendlyKingSquare[1] - opponentKingSquare[1]);

    evaluation += 14 - distBetweenKings;

    return evaluation * weight;
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
        return chess.turn() === 'w' ? -99999 : 99999;
    } else if (chess.in_draw()) {
        return 0;
    }

    let totalValue = 0;

    const board = chess.board(); // 2D array: 8 rows of 8 squares
    const endgameWeightFactor = endgameWeight();
    let rank = 0;
    for (let row of board) {
        let file = 0;
        for (let square of row) {
            if (square) {
                const pieceValue = pieceValues[square.type] * (square.color === 'w' ? 1 : -1);
                totalValue += pieceValue;
                
                const squareName = String.fromCharCode('a'.charCodeAt(0) + file) + (8 - rank);
                const psqValue = pieceSquareValue(square.type, squareName, square.color, endgameWeightFactor);
                totalValue += psqValue //* (square.color === 'w' ? 1 : -1);
            }
            file++;
        }
        rank++;
    }
    // Endgame evaluation
    if (endgameWeightFactor > 0) {
        let value = 2 * forceKingToCornerEndgame(endgameWeightFactor);
        //console.log(`Endgame evaluation value: ${value}`);
        if (chess.turn() === 'w') {
            totalValue -= value;
        } else {
            totalValue += value;
        }
    }

    return totalValue;
}

function quiescence(alpha, beta, maximizing) {
    // evaluate until poaition is stable (no more captures)
    let score = evaluateBoard();
    if (maximizing) {
        if (score >= beta) {
            return beta; 
        }
        if (alpha < score) {
            alpha = score;
        }
    } else {
        if (score <= alpha) {
            return alpha; 
        }
        if (beta > score) {
            beta = score;
        }
    }

    let capturedMoves = chess.moves({ verbose: true }).filter(move => move.captured);
    let orderedMoves = orderMoves(capturedMoves);

    if (maximizing) {
        for (let move of orderedMoves) {
            chess.move(move);
            score = quiescence(alpha, beta, false);
            chess.undo();
            if (score >= beta) {
                return beta; 
            }
            if (alpha < score) {
                alpha = score;
            }
        }
        return alpha;
    } else {
        for (let move of orderedMoves) {
            chess.move(move);
            score = quiescence(alpha, beta, true);
            chess.undo();
            if (score <= alpha) {
                return alpha; 
            }
            if (beta > score) {
                beta = score;
            }
        }
        return beta;
    }
}


function minimax(depth, alpha, beta, maximizing) {
    minimaxCalls++;
    alphaOriginal = alpha;
    betaOriginal = beta;

    let key = hashString(chess.fen());

    if (transpositionTable[key]) {
        let entry = transpositionTable[key];
        console.log('TT hit at depth', depth, 'key=', key, 'entry=', transpositionTable[key]);
        transpositions++;
        if (entry.depth >= depth) {
            if (entry.type === 'exact') {
                return entry.value; // exact value
            } else if (entry.type === 'lowerbound') {
                alpha = Math.max(alpha, entry.value);
            } else if (entry.type === 'upperbound') {
                beta = Math.min(beta, entry.value);
            }
            if (beta <= alpha) {
                return entry.value; // alpha-beta cutoff
            }
        }
    }

    let score = 0;

    if (depth == 0 || chess.game_over()) {
        if (chess.in_checkmate()) {
            score = maximizing ? -99999 - (10 * depth) : 99999 + (10 * depth);
            console.log(`Checkmate at depth ${depth}: ${score}`);
        } else if (chess.in_draw()) {
            score = 0;
        } else {
            // Evaluate the board position
            //const evaluation = evaluateBoard();
            //console.log(`Evaluation at depth ${depth}: ${evaluation}`);
            score = quiescence(alpha, beta, maximizing);
        }
        transpositionTable[key] = {
            value: score,
            depth: depth,
            type: 'exact' // exact value
        }
        return score;
    } 

    if (maximizing) {
        let maxEval = -99999;
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
        score = maxEval;

    } else {
        let minEval = 99999;
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
        score = minEval;
    }
    let entryType = null;
    // Store the transposition table entry
    if (score <= alphaOriginal) {
        entryType = 'upperbound';
    } else if (score >= betaOriginal) {
        entryType = 'lowerbound';
    } else {
        entryType = 'exact';
    }
    transpositionTable[key] = {
        value: score,
        depth: depth,
        type: entryType
    };
    return score;
}


function getBestMove(depth = 3) {
    const moves = chess.moves({ verbose: true });
    const orderedMoves = orderMoves(moves);
    let bestMove = null;
    minimaxCalls = 0;
    transpositions = 0;
    if (chess.turn() === 'b') {
        let bestValue = 99999;

        for (let move of orderedMoves) {
            chess.move(move);
            const moveValue = minimax(depth - 1, -99999, 99999, true);
            chess.undo();

            if (moveValue < bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        }
        console.log(`Best move: ${bestMove.san}, Value: ${bestValue}`);
        console.log(`number of minimax calls: ${minimaxCalls}`);
        console.log(`number of transpositions: ${transpositions}`);
        return bestMove;
    } else {
        let bestValue = -99999;

        for (let move of orderedMoves) {
            chess.move(move);
            const moveValue = minimax(depth - 1, -99999, 99999, false);
            chess.undo();

            if (moveValue > bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        }
        console.log(`Best move: ${bestMove.san}, Value: ${bestValue}`);
        console.log(`number of minimax calls: ${minimaxCalls}`);
        return bestMove;
    }
}

function makeBestMove() {
    if (chess.game_over()) {
        alert("Game over!");
        return;
    }

    const bestMove = getBestMove();
    chess.move(bestMove);
    board.position(chess.fen());
    if (chess.game_over()) {
        alert("Game over!");
        return;
    }
}