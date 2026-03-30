import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, RefreshCw, Terminal, Cpu, HardDrive } from 'lucide-react';

type Point = { x: number; y: number };
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: "SECTOR_01_DRIVE", artist: "UNKNOWN_ENTITY", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", cover: "https://picsum.photos/seed/glitch1/400/400?grayscale" },
  { id: 2, title: "CORRUPTED_PULSE", artist: "SYS.ADMIN", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", cover: "https://picsum.photos/seed/glitch2/400/400?grayscale" },
  { id: 3, title: "NULL_HORIZON", artist: "VOID_PROC", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", cover: "https://picsum.photos/seed/glitch3/400/400?grayscale" },
];

const generateFood = (currentSnake: Point[]): Point => {
  if (currentSnake.length >= GRID_SIZE * GRID_SIZE) return { x: -1, y: -1 };
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const directionRef = useRef(direction);
  const lastProcessedDirection = useRef(direction);

  useEffect(() => { directionRef.current = direction; }, [direction]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirection.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
    setHasStarted(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !hasStarted) return;

    setSnake((prev) => {
      const head = prev[0];
      const currentDir = directionRef.current;
      lastProcessedDirection.current = currentDir;

      const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        return prev;
      }

      // Self collision
      if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prev;
      }

      const newSnake = [newHead, ...prev];

      // Food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 16; // Hex-like increments
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, isPaused, hasStarted, food, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameOver) resetGame();
        else if (!hasStarted) setHasStarted(true);
        else setIsPaused(p => !p);
        return;
      }

      if (!hasStarted || gameOver || isPaused) return;

      const { x, y } = lastProcessedDirection.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, gameOver, isPaused]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // Music Effects
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleNext = () => setCurrentTrackIndex((i) => (i + 1) % TRACKS.length);
  const handlePrev = () => setCurrentTrackIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length);
  
  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-black text-[#00FFFF] font-terminal flex flex-col selection:bg-[#FF00FF] selection:text-black scanlines">
      <div className="static-noise" />
      
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleNext}
      />

      {/* Header */}
      <header className="px-6 py-4 border-b-4 border-[#FF00FF] flex justify-between items-center bg-black z-10 relative">
        <div className="flex items-center gap-4">
          <Terminal className="text-[#00FFFF]" size={32} />
          <h1 
            className="text-2xl md:text-4xl font-pixel text-[#00FFFF] glitch-aggressive"
            data-text="SYS.SNAKE_EXEC"
          >
            SYS.SNAKE_EXEC
          </h1>
        </div>
        <div className="flex items-center gap-8 font-pixel text-sm md:text-base">
          <div className="flex flex-col items-end">
            <span className="text-[#FF00FF]">DATA_VOL</span>
            <span className="text-2xl">{score.toString().padStart(4, '0')}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[#FF00FF] flex items-center gap-2">
              <Cpu size={16} /> PEAK_VOL
            </span>
            <span className="text-2xl">{highScore.toString().padStart(4, '0')}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
        
        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative screen-tear">
          <div className="relative w-full max-w-[600px] aspect-square bg-black border-4 border-[#00FFFF] overflow-hidden shadow-[8px_8px_0px_#FF00FF]">
            
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'linear-gradient(to right, #00FFFF 1px, transparent 1px), linear-gradient(to bottom, #00FFFF 1px, transparent 1px)',
              backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
            }} />

            {/* Game Entities */}
            {hasStarted && (
              <>
                {/* Food */}
                <div
                  className="absolute bg-[#FF00FF] animate-pulse"
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(food.x / GRID_SIZE) * 100}%`,
                    top: `${(food.y / GRID_SIZE) * 100}%`,
                  }}
                />

                {/* Snake */}
                {snake.map((segment, i) => {
                  const isHead = i === 0;
                  return (
                    <div
                      key={`${segment.x}-${segment.y}-${i}`}
                      className={`absolute ${isHead ? 'bg-[#FF00FF] z-10' : 'bg-[#00FFFF]'}`}
                      style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        left: `${(segment.x / GRID_SIZE) * 100}%`,
                        top: `${(segment.y / GRID_SIZE) * 100}%`,
                        border: '1px solid #000'
                      }}
                    />
                  );
                })}
              </>
            )}

            {/* Overlays */}
            {!hasStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 font-pixel text-center p-4">
                <Terminal size={64} className="text-[#FF00FF] mb-6 animate-pulse" />
                <h2 className="text-2xl md:text-3xl text-[#00FFFF] mb-4 glitch-aggressive" data-text="AWAITING_INPUT...">AWAITING_INPUT...</h2>
                <p className="text-[#FF00FF] mb-8 text-sm md:text-base">EXECUTE <span className="bg-[#00FFFF] text-black px-2 py-1">SPACE</span> TO INITIALIZE</p>
                <div className="flex gap-4 text-xs text-[#00FFFF]">
                  <span>DIR_CTRL: [W][A][S][D]</span>
                </div>
              </div>
            )}

            {isPaused && hasStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 font-pixel">
                <h2 className="text-4xl text-[#FF00FF] glitch-aggressive" data-text="PROCESS_SUSPENDED">PROCESS_SUSPENDED</h2>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 font-pixel text-center p-4">
                <h2 className="text-3xl md:text-5xl text-[#FF00FF] mb-4 glitch-aggressive" data-text="FATAL_EXCEPTION">FATAL_EXCEPTION</h2>
                <p className="text-[#00FFFF] mb-8 text-lg">FINAL_DUMP: <span className="text-[#FF00FF]">{score.toString().padStart(4, '0')}</span></p>
                <button
                  onClick={resetGame}
                  className="px-6 py-4 bg-[#00FFFF] text-black hover:bg-[#FF00FF] hover:text-white transition-colors flex items-center gap-3 text-lg border-4 border-transparent hover:border-[#00FFFF]"
                >
                  <RefreshCw size={24} />
                  REBOOT_SYS()
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Music Player Sidebar */}
        <div className="w-full lg:w-96 bg-black border-t-4 lg:border-t-0 lg:border-l-4 border-[#FF00FF] p-6 flex flex-col gap-8 z-10">
          <div className="flex items-center gap-3 text-[#00FFFF] font-pixel border-b-2 border-[#00FFFF] pb-4">
            <HardDrive size={24} />
            <h2>AUDIO_STREAM</h2>
          </div>

          {/* Cover Art */}
          <div className="relative aspect-square border-4 border-[#00FFFF] overflow-hidden group bg-black">
            <img 
              src={currentTrack.cover} 
              alt="Cover" 
              className={`w-full h-full object-cover filter contrast-150 grayscale ${isPlaying ? 'scale-110' : 'scale-100'} transition-transform duration-1000`} 
            />
            <div className="absolute inset-0 bg-[#FF00FF]/20 mix-blend-overlay" />
            
            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 border-t-4 border-[#FF00FF]">
              <h3 
                className="text-xl font-pixel text-[#00FFFF] mb-2 truncate glitch-aggressive"
                data-text={currentTrack.title}
              >
                {currentTrack.title}
              </h3>
              <p className="text-[#FF00FF] text-lg truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <button onClick={handlePrev} className="p-4 bg-black border-2 border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black transition-colors">
                <SkipBack size={24} />
              </button>
              <button
                onClick={handlePlayPause}
                className="p-6 bg-[#FF00FF] text-black border-4 border-[#00FFFF] hover:bg-[#00FFFF] hover:border-[#FF00FF] transition-colors"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </button>
              <button onClick={handleNext} className="p-4 bg-black border-2 border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black transition-colors">
                <SkipForward size={24} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-4 bg-black border-2 border-[#FF00FF] p-3">
              <Volume2 size={20} className="text-[#FF00FF]" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-black border border-[#00FFFF] appearance-none cursor-pointer accent-[#FF00FF]"
              />
            </div>
          </div>

          {/* Tracklist */}
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
            <h4 className="text-lg text-[#FF00FF] border-b border-[#FF00FF] pb-2 sticky top-0 bg-black">MEMORY_BANKS</h4>
            {TRACKS.map((track, idx) => (
              <button
                key={track.id}
                onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); }}
                className={`flex items-center gap-4 p-3 border-2 transition-colors text-left ${
                  idx === currentTrackIndex
                    ? 'border-[#00FFFF] bg-[#00FFFF]/10'
                    : 'border-zinc-800 hover:border-[#FF00FF]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-lg truncate ${idx === currentTrackIndex ? 'text-[#00FFFF]' : 'text-zinc-400'}`}>
                    {idx === currentTrackIndex ? '> ' : ''}{track.title}
                  </p>
                  <p className="text-sm text-[#FF00FF] truncate">{track.artist}</p>
                </div>
                {idx === currentTrackIndex && isPlaying && (
                  <div className="flex items-end gap-1 h-6">
                    <div className="w-2 bg-[#00FFFF] animate-[bounce_0.5s_infinite] h-full" />
                    <div className="w-2 bg-[#FF00FF] animate-[bounce_0.7s_infinite] h-2/3" />
                    <div className="w-2 bg-[#00FFFF] animate-[bounce_0.6s_infinite] h-4/5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
