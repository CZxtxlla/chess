const chess = new Chess();

const board = ChessBoard('board', {
    position: chess.fen(),
    draggable: true,
    onDrop: onDrop,
});

function onDrop(source, target) {
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
