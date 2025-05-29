const chess = new Chess();
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'

function removeGreySquares () {
    $('#board .square-55d63').css('background', '')
}

function greySquare (square) {
    var $square = $('#board .square-' + square)

    var background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
}

$square.css('background', background)
}

function onDragStart (source, piece) {
    // do not pick up pieces if the game is over
    if (chess.game_over()) return false
  
    // or if it's not that side's turn
    if ((chess.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (chess.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false
    }
}

function onDrop(source, target) {
    removeGreySquares()

    const moves = chess.moves({ verbose: true });
    const moveObj = moves.find(m => m.from === source && m.to === target); // get the move object to check for promotion

    if (!moveObj) return 'snapback'; // if the move is not valid, snap back

    let promotion = 'q'; // default

    if (moveObj.promotion) {
        promotion = prompt("Promote to (q, r, b, n):", "q"); // get user input
        if (!['q', 'r', 'b', 'n'].includes(promotion)) promotion = 'q'; // default to queen if input invalid
    }

    const move = chess.move({
        from: source,
        to: target,
        promotion: promotion // always promote to a queen for simplicity
    });

    if (move === null) return 'snapback';
    window.setTimeout(makeBestMove, 250);
}

function onMouseoverSquare (square, piece) {
    // get list of possible moves for this square
    var moves = chess.moves({
      square: square,
      verbose: true
    })
  
    // exit if there are no moves available for this square
    if (moves.length === 0) return
  
    // highlight the square they moused over
    greySquare(square)
  
    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
      greySquare(moves[i].to)
    }
}

function onMouseoutSquare (square, piece) {
    removeGreySquares()
}

function onSnapEnd () {
    board.position(chess.fen())
}

document.getElementById('reset-btn').addEventListener('click', () => {
    chess.reset();                // Reset game state
    board.position('start');     // Reset board position
});


const board = ChessBoard('board', {
    position: chess.fen(),
    draggable: true,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
});