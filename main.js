const chess = new Chess();

const board = ChessBoard('board', {
    position: chess.fen(),
    draggable: false
});

document.getElementById('next-move').addEventListener('click', () => {
    if (!chess.game_over()) {
      const moves = chess.moves();
      const move = moves[Math.floor(Math.random() * moves.length)];
      chess.move(move);
      board.position(chess.fen());
    } else {
      alert("Game over!");
    }
  });