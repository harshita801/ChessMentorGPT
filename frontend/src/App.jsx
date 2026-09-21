import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [playerColor, setPlayerColor] = useState('white');
  const [rating, setRating] = useState(800);
  const [turn, setTurn] = useState('W');
  const [legalMovesCount, setLegalMovesCount] = useState(20);
  const [inCheck, setInCheck] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Board Theme
  const [boardTheme, setBoardTheme] = useState('classic');

  // Banners & Modals
  const [gameStatusBanner, setGameStatusBanner] = useState(null);
  const [gameOverModal, setGameOverModal] = useState(null);

  // Captured pieces
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);

  // Pawn Promotion
  const [pendingMove, setPendingMove] = useState(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  const gameRef = useRef(null);
  const boardRef = useRef(null);
  const chatEndRef = useRef(null);
  const handleDropRef = useRef(null);

  useEffect(() => {
    handleDropRef.current = handleDrop;
  });

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const pieceSymbols = {
    p: '♟', n: '♞', b: '♝', r: '♜', q: '♛',
    P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕'
  };

  useEffect(() => {
    if (window.Chess && window.Chessboard) {
      gameRef.current = new window.Chess();
      boardRef.current = window.Chessboard('myBoard', {
        draggable: true,
        position: 'start',
        orientation: playerColor,
        onDragStart: handleDragStart,
        onDrop: (source, target) => {
          if (handleDropRef.current) {
            return handleDropRef.current(source, target);
          }
        },
        onSnapEnd: handleSnapEnd,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
      });

      updateMetrics();
      setupMouseHoverHandlers();

      const handleResize = () => {
        if (boardRef.current) boardRef.current.resize();
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const showStatusBanner = (message) => {
    setGameStatusBanner(message);
    setTimeout(() => {
      setGameStatusBanner(null);
    }, 3000);
  };

  const updateRating = (outcome) => {
    const K = 32;
    let change = 0;
    if (outcome === 'win') change = K;
    else if (outcome === 'loss') change = -K;
    setRating((prev) => Math.max(400, prev + change));
  };

  const clearCheckHighlights = () => {
    document.querySelectorAll('.square-55d63').forEach((square) => {
      square.style.backgroundColor = '';
    });
  };

  const highlightKingInCheck = () => {
    clearCheckHighlights();
    if (!gameRef.current) return;

    const isCheck = gameRef.current.in_check ? gameRef.current.in_check() : gameRef.current.inCheck();
    if (isCheck) {
      const turnColor = gameRef.current.turn();
      const kingSquare = findKingSquare(turnColor);
      if (kingSquare && window.$) {
        window.$(`#myBoard .square-${kingSquare}`).css('background-color', 'rgba(239, 68, 68, 0.7)');
      }
      showStatusBanner("CHECK! ⚠️");
    }
  };

  const setupMouseHoverHandlers = () => {
    if (!window.$) return;
    window.$('#myBoard').off('mouseenter mouseleave', '.square-55d63');
    window.$('#myBoard').on('mouseenter', '.square-55d63', function () {
      const square = window.$(this).attr('data-square');
      if (!square || !gameRef.current) return;
      const piece = gameRef.current.get(square);
      if (!piece) return;
      const moves = gameRef.current.moves({ square: square, verbose: true });
      moves.forEach((m) => {
        window.$(`#myBoard .square-${m.to}`).addClass('square-hint-hover');
      });
    });
    window.$('#myBoard').on('mouseleave', '.square-55d63', function () {
      if (window.$) {
        window.$('#myBoard .square-55d63').removeClass('square-hint-hover');
      }
    });
  };

  const findKingSquare = (color) => {
    const boardState = gameRef.current.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          return `${files[c]}${8 - r}`;
        }
      }
    }
    return null;
  };

  const updateCapturedPieces = () => {
    if (!gameRef.current) return;
    const initial = { p: 8, n: 2, b: 2, r: 2, q: 1, P: 8, N: 2, B: 2, R: 2, Q: 1 };
    const currentBoard = gameRef.current.board();

    currentBoard.forEach((row) => {
      row.forEach((square) => {
        if (square) {
          const type = square.color === 'w' ? square.type.toUpperCase() : square.type;
          if (initial[type] !== undefined) initial[type]--;
        }
      });
    });

    const takenBlack = [];
    const takenWhite = [];

    ['p', 'n', 'b', 'r', 'q'].forEach((type) => {
      for (let i = 0; i < initial[type]; i++) takenBlack.push(pieceSymbols[type]);
    });
    ['P', 'N', 'B', 'R', 'Q'].forEach((type) => {
      for (let i = 0; i < initial[type]; i++) takenWhite.push(pieceSymbols[type]);
    });

    setCapturedBlack(takenBlack);
    setCapturedWhite(takenWhite);
  };

  const updateMetrics = () => {
    const game = gameRef.current;
    if (!game) return;

    setTurn(game.turn() === 'w' ? 'W' : 'B');
    setLegalMovesCount(game.moves().length);
    setInCheck(game.in_check());
    updateCapturedPieces();
    highlightKingInCheck();
  };

  const handleDragStart = (source, piece) => {
    const game = gameRef.current;
    if (!game || game.game_over()) return false;

    const isWhiteTurn = game.turn() === 'w';
    if (isWhiteTurn && piece.search(/^b/) !== -1) return false;
    if (!isWhiteTurn && piece.search(/^w/) !== -1) return false;
  };

  const handleDrop = (source, target) => {
    const game = gameRef.current;
    if (!game || source === target) return 'snapback';

    const piece = game.get(source);
    const isPawn = piece && piece.type === 'p';
    const isPromotionRank =
      (piece?.color === 'w' && target[1] === '8') ||
      (piece?.color === 'b' && target[1] === '1');

    if (isPawn && isPromotionRank) {
      const testMove = game.move({ from: source, to: target, promotion: 'q' });
      if (!testMove) return 'snapback';

      game.undo();
      setPendingMove({ source, target });
      setShowPromotionModal(true);
      return 'snapback';
    }

    return executeMove(source, target, 'q');
  };

  const executeMove = (source, target, promotionPiece = 'q') => {
    const game = gameRef.current;
    if (!game) return 'snapback';

    const move = game.move({
      from: source,
      to: target,
      promotion: promotionPiece
    });

    if (move === null) return 'snapback';

    updateMetrics();

    // Check game over
    const isGameOver = game.game_over ? game.game_over() : game.isGameOver();
    const isCheckmate = game.in_checkmate ? game.in_checkmate() : game.isCheckmate();

    if (isGameOver) {
      if (isCheckmate) {
        setGameOverModal({ title: "🎉 Victory!", message: "Checkmate! You won!" });
        updateRating('win');
      } else {
        setGameOverModal({ title: "🤝 Draw!", message: "The game ended in a draw." });
        updateRating('draw');
      }
      return;
    }

    // Trigger engine response move
    setTimeout(() => {
      makeEngineMove();
    }, 300);
  };

  const handleSelectPromotion = (pieceChoice) => {
    if (pendingMove) {
      setShowPromotionModal(false);
      executeMove(pendingMove.source, pendingMove.target, pieceChoice);
      setPendingMove(null);
    }
  };

  const handleSnapEnd = () => {
    if (boardRef.current && gameRef.current) {
      boardRef.current.position(gameRef.current.fen(), false);
    }
  };

  const makeEngineMove = async () => {
    if (!gameRef.current) return;

    try {
      const res = await fetch('https://chessmentorgpt-backend.onrender.com/api/engine-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: gameRef.current.fen(),
          player_elo: rating
        })
      });

      const data = await res.json();

      if (data.move) {
        gameRef.current.move(data.move, { sloppy: true });

        if (boardRef.current) {
          boardRef.current.position(gameRef.current.fen());
        }

        updateMetrics();

        const postMoveGameOver = gameRef.current.game_over ? gameRef.current.game_over() : gameRef.current.isGameOver();
        const postMoveCheckmate = gameRef.current.in_checkmate ? gameRef.current.in_checkmate() : gameRef.current.isCheckmate();

        if (postMoveGameOver) {
          if (postMoveCheckmate) {
            setGameOverModal({ title: "♟️ Game Over", message: "Checkmate! Coach won the game." });
            updateRating('loss');
          } else {
            setGameOverModal({ title: "🤝 Draw!", message: "The match ended in a draw." });
            updateRating('draw');
          }
        }
      }
    } catch (err) {
      console.error("Engine move error:", err);
    }
  };

  const handleStartNewGame = (resetChatHistory = false) => {
    setGameOverModal(null);
    if (gameRef.current) gameRef.current.reset();
    if (boardRef.current) {
      boardRef.current.orientation(playerColor);
      boardRef.current.start();
    }
    clearCheckHighlights();
    updateMetrics();

    if (resetChatHistory) setChatMessages([]);

    if (playerColor === 'black') {
      setTimeout(makeEngineMove, 400);
    }
  };

  const handleSelectSide = (color) => {
    setPlayerColor(color);
    setGameOverModal(null);
    if (gameRef.current) gameRef.current.reset();
    if (boardRef.current) {
      boardRef.current.orientation(color);
      boardRef.current.start();
    }
    clearCheckHighlights();
    updateMetrics();

    if (color === 'black') {
      setTimeout(makeEngineMove, 400);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const promptToSend = inputText;
    setChatMessages((prev) => [...prev, { sender: 'YOU', text: promptToSend }]);
    setInputText('');

    const currentFen = gameRef.current ? gameRef.current.fen() : "";

    try {
      const res = await fetch('https://chessmentorgpt-backend.onrender.com/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          fen: currentFen
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          { sender: 'COACH', text: data.llm_response || data.response }
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  return (
    <div className={`app-container theme-${boardTheme}`}>
      <header className="top-header">
        <div className="brand-container">
          <div className="brand-icon">♟</div>
          <div className="brand-text">
            <h1>ChessMentorGPT</h1>
            <span className="sub-brand">
              POWERED BY <a href="https://pawnrace.com" target="_blank" rel="noopener noreferrer" className="brand-link">pawnrace.com</a>
            </span>
          </div>
        </div>

        <div className="header-actions">
          <div className="theme-selector">
            <label htmlFor="theme-select">Board Style: </label>
            <select
              id="theme-select"
              value={boardTheme}
              onChange={(e) => setBoardTheme(e.target.value)}
              className="select-theme"
            >
              <option value="classic">🪵 Classic Wood</option>
              <option value="slate">🪨 Slate Blue</option>
              <option value="marble">🏛 Marble Classic</option>
            </select>
          </div>

          <div className="control-group">
            <button className={`btn-toggle ${playerColor === 'white' ? 'active' : ''}`} onClick={() => handleSelectSide('white')}>⚪ Play White</button>
            <button className={`btn-toggle ${playerColor === 'black' ? 'active' : ''}`} onClick={() => handleSelectSide('black')}>⚫ Play Black</button>
          </div>

          <div className="stats-group">
            <span className="badge-mistakes">Rating: {rating} ELO</span>
            <button className="btn-new-match" onClick={() => handleStartNewGame(false)}>New Match</button>
          </div>
        </div>
      </header>

      <main className="app-workspace">
        <section className="board-section">
          <div className="board-center-container" style={{ position: 'relative' }}>
            <div id="myBoard" className={`chessboard-wrapper theme-${boardTheme}`}></div>

            {gameStatusBanner && (
              <div className="game-over-overlay">
                {gameStatusBanner}
              </div>
            )}

            <div className="board-metrics">
              <div className="captured-row">
                <span>Captured Black: {capturedBlack.join(' ')}</span>
              </div>
              <div className="captured-row">
                <span>Captured White: {capturedWhite.join(' ')}</span>
              </div>
              <div className="game-info">
                <span>Turn: {turn}</span> | <span>Legal Moves: {legalMovesCount}</span> | <span>Check: {String(inCheck)}</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="coach-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#94a3b8' }}>COACH CHAT</span>
            <button 
              onClick={() => setChatMessages([])} 
              style={{
                background: '#334155',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              💬 New Chat
            </button>
          </div>

          {/* Tactic Chips */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
              🎯 LEARN CHESS TRICKS:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                "Knight Fork", "Pin & Skewer", "Scholar's Mate", 
                "Discovered Attack", "Smothered Mate", "En Passant", 
                "Fried Liver Attack"
              ].map((tactic, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(`Explain the ${tactic} trick and how to use it!`);
                  }}
                  style={{
                    background: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #0284c7',
                    borderRadius: '12px',
                    padding: '3px 9px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ✨ {tactic}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-history">
            {chatMessages.map((msg, i) => (
              <div key={i} className="chat-card">
                <div className="coach-title">{msg.sender}</div>
                <p>{msg.text}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              type="text"
              value={inputText}
              placeholder="Ask about tactics, openings, or errors..."
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button className="btn-ask" onClick={handleSendMessage}>Ask</button>
          </div>
        </aside>
      </main>

      {/* Game Over Popup */}
      {gameOverModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999
        }}>
          <div style={{
            background: '#1e293b',
            border: '2px solid #38bdf8',
            borderRadius: '16px',
            padding: '28px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%',
            color: '#fff'
          }}>
            <h2 style={{ color: '#38bdf8', marginTop: 0 }}>{gameOverModal.title}</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>{gameOverModal.message}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => handleStartNewGame(false)} 
                style={{ padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                🎮 New Game (Keep Chat)
              </button>
              <button 
                onClick={() => handleStartNewGame(true)} 
                style={{ padding: '12px', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                💬 New Game & Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pawn Promotion Modal */}
      {showPromotionModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999
        }}>
          <div style={{
            background: '#1e293b',
            border: '2px solid #fde047',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: '#fff'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#fde047' }}>Promote Pawn To:</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleSelectPromotion('q')} style={{ padding: '12px 18px', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}>♛ Queen</button>
              <button onClick={() => handleSelectPromotion('r')} style={{ padding: '12px 18px', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}>♜ Rook</button>
              <button onClick={() => handleSelectPromotion('b')} style={{ padding: '12px 18px', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}>♝ Bishop</button>
              <button onClick={() => handleSelectPromotion('n')} style={{ padding: '12px 18px', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}>♞ Knight</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}