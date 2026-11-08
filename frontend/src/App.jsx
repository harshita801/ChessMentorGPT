import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [playerColor, setPlayerColor] = useState('white');
  const [rating, setRating] = useState(0);
  const [turn, setTurn] = useState('W');
  const [legalMovesCount, setLegalMovesCount] = useState(20);
  const [inCheck, setInCheck] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false); // Added lock state

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
  };
}