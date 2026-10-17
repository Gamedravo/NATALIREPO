import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { birthdayConfig as config } from './config';

type Scene = 'code' | 'welcome' | 'album' | 'cake' | 'letter' | 'wish' | 'finale';
type IntroPhase = 'count' | 'heart' | 'reveal' | 'ready';

type CodeStream = {
  x: number;
  head: number;
  speed: number;
  length: number;
  density: number;
  opacity: number;
  phrase: string | null;
};

function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    let raf = 0;
    let lastFrame = 0;
    let cell = 16;
    let streams: CodeStream[] = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glyphs = '01{}[]<>;=+$#%&*/\\NATALI♥';
    const phrases = ['LOVE', 'NATALI'];

    const render = () => {
      frame += 1;
      ctx.fillStyle = 'rgba(23, 10, 19, 0.18)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${cell}px "DM Mono", monospace`;
      ctx.textBaseline = 'top';
      streams.forEach((stream, streamIndex) => {
        for (let tail = 0; tail < stream.length; tail += 1) {
          const y = stream.head - tail * cell;
          if (y < -cell || y > height || Math.random() > stream.density) continue;
          const char = stream.phrase
            ? stream.phrase[(Math.floor(frame / 8) + tail) % stream.phrase.length]
            : glyphs[Math.floor(Math.random() * glyphs.length)];
          ctx.globalAlpha = stream.opacity * Math.max(0.32, 1 - tail / stream.length);
          ctx.fillStyle = tail === 0 ? '#fff0f7' : streamIndex % 3 === 0 ? config.colors.codePink : '#e83b88';
          ctx.fillText(char, stream.x, y);
        }
        if (stream.phrase && Math.floor(frame / 80) % 3 === streamIndex % 3) {
          ctx.globalAlpha = stream.opacity * 0.8;
          ctx.fillStyle = '#ffadd0';
          ctx.fillText(stream.phrase, stream.x, stream.head);
        }
        stream.head += stream.speed;
        if (stream.head > height + stream.length * cell) {
          stream.head = -Math.random() * height * 0.24;
          stream.speed = 0.8 + Math.random() * 1.7;
          stream.length = 8 + Math.floor(Math.random() * 19);
          stream.density = 0.66 + Math.random() * 0.34;
          stream.opacity = 0.62 + Math.random() * 0.38;
        }
      });
      ctx.globalAlpha = 1;
    };

    const animate = (now: number) => {
      if (now - lastFrame >= config.durations.codeFrame) {
        render();
        lastFrame = now;
      }
      raf = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = width < 600 ? 14 : 17;
      const columns = Math.ceil(width / cell);
      streams = Array.from({ length: columns }, (_, index) => ({
        x: index * cell,
        head: Math.random() * height,
        speed: 0.8 + Math.random() * 1.7,
        length: 8 + Math.floor(Math.random() * 19),
        density: 0.66 + Math.random() * 0.34,
        opacity: 0.62 + Math.random() * 0.38,
        phrase: index % 13 === 4 ? phrases[Math.floor(Math.random() * phrases.length)] : null,
      }));
      ctx.fillStyle = config.colors.codeBackground;
      ctx.fillRect(0, 0, width, height);
      render();
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reducedMotion) raf = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <canvas className="rain-canvas" ref={canvasRef} aria-hidden="true" data-testid="canvas-code-rain" />;
}

function heartCode() {
  const lines: string[] = [];
  const code = '{}[]<>/\\01NTL';
  for (let y = 1.35; y > -1.3; y -= 0.16) {
    let line = '';
    for (let x = -1.48; x < 1.49; x += 0.11) {
      const v = (x * x + y * y - 1) ** 3 - x * x * y ** 3;
      line += v <= 0 ? code[Math.floor(Math.random() * code.length)] : ' ';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function RevealLine({ text }: { text: string }) {
  return <span className="reveal-line">{Array.from(text).map((character, index) => <span className="reveal-char" style={{ animationDelay: `${index * 38}ms` }} key={`${character}-${index}`}>{character}</span>)}</span>;
}

function RosePetals() {
  return <div className="rose-petals" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>;
}

function CakeAndBouquet({
  wished,
  roseMessage,
  onTapRoses,
}: {
  wished: boolean;
  roseMessage: boolean;
  onTapRoses: () => void;
}) {
  return (
    <div className={`gift-scene ${wished ? 'is-wished' : ''}`} aria-label="Illustrated birthday cake and bouquet of roses" data-testid="illustration-cake-bouquet">
      <div className="cake" aria-label="Birthday cake with a candle">
        <div className={`candle ${wished ? 'blown-out' : ''}`}><span className="flame" /></div>
        <div className="cake-top"><span className="cake-heart">♥</span><i className="icing-drop one" /><i className="icing-drop two" /><i className="icing-drop three" /></div>
        <div className="cake-tier" />
      </div>
      <button
        type="button"
        className={`bouquet ${roseMessage ? 'sway' : ''}`}
        aria-label="Tap the bouquet of roses"
        onClick={onTapRoses}
        data-testid="button-bouquet"
      >
        <div className="stems" /><span className="rose-leaf" /><span className="rose-leaf leaf2" />
        <span className="rose r1" /><span className="rose r2" /><span className="rose r3" /><span className="rose r4" /><span className="rose r5" />
        <span className="baby-breath breath-one" /><span className="baby-breath breath-two" /><span className="baby-breath breath-three" />
        <div className="wrap-paper"><span className="wrap-ribbon" /><span className="bouquet-tag">{config.copy.bouquetTag}</span></div>
      </button>
      {wished && <div className="wish-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>}
    </div>
  );
}

function App() {
  const [scene, setScene] = useState<Scene>('code');
  const [introPhase, setIntroPhase] = useState<IntroPhase>('count');
  const [count, setCount] = useState(1);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [pageTurning, setPageTurning] = useState(false);
  const [cakeWished, setCakeWished] = useState(false);
  const [roseMessage, setRoseMessage] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [typedLetter, setTypedLetter] = useState('');
  const [starLaunched, setStarLaunched] = useState(false);
  const [showStarResponse, setShowStarResponse] = useState(false);
  const [heart, setHeart] = useState('');
  const touchStartX = useRef<number | null>(null);
  const interactionTimers = useRef<number[]>([]);
  const themeStyle = {
    '--natali-ink': config.colors.ink,
    '--natali-blush': config.colors.blush,
    '--natali-rose': config.colors.rose,
    '--natali-gold': config.colors.gold,
    '--natali-code-background': config.colors.codeBackground,
    '--natali-code-pink': config.colors.codePink,
    '--natali-transition': `${config.durations.transition}ms`,
    '--natali-page-turn': `${config.durations.pageTurn}ms`,
    '--natali-fireworks-loop': `${config.durations.fireworksLoop}ms`,
  } as CSSProperties;
  const scheduleInteraction = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      interactionTimers.current = interactionTimers.current.filter((item) => item !== timer);
      callback();
    }, delay);
    interactionTimers.current.push(timer);
  };

  const clearInteractionTimers = () => {
    interactionTimers.current.forEach(window.clearTimeout);
    interactionTimers.current = [];
  };

  const nextPhoto = () => {
    if (pageTurning) return;
    if (!albumOpen) {
      setAlbumOpen(true);
      return;
    }
    setPageTurning(true);
    scheduleInteraction(() => setPageTurning(false), config.durations.pageTurn);
    if (photoIndex === 0) {
      setPhotoIndex(1);
    } else {
      setAlbumOpen(false);
      scheduleInteraction(() => setScene('cake'), config.durations.pageTurn);
    }
  };

  const launchStar = () => {
    if (starLaunched) return;
    setStarLaunched(true);
    scheduleInteraction(() => setShowStarResponse(true), 1600);
  };

  useEffect(() => () => clearInteractionTimers(), []);
  useEffect(() => () => clearInteractionTimers(), [scene]);

  useEffect(() => setHeart(heartCode()), []);
  useEffect(() => {
    if (!letterOpen) {
      setTypedLetter('');
      return;
    }
    setTypedLetter('');
    let position = 0;
    const timer = window.setInterval(() => {
      position = Math.min(position + 2, config.secretLetter.text.length);
      setTypedLetter(config.secretLetter.text.slice(0, position));
      if (position >= config.secretLetter.text.length) window.clearInterval(timer);
    }, config.durations.letterCharacter);
    return () => window.clearInterval(timer);
  }, [letterOpen]);

  useEffect(() => {
    if (scene !== 'code' || introPhase === 'ready') return;
    let timer: number;
    if (introPhase === 'count') {
      timer = window.setTimeout(() => {
        if (count < 3) setCount((n) => n + 1);
        else setIntroPhase('heart');
      }, config.durations.countdownStep);
    } else if (introPhase === 'heart') {
      timer = window.setTimeout(() => setIntroPhase('reveal'), config.durations.heartHold);
    } else {
      timer = window.setTimeout(() => setIntroPhase('ready'), config.durations.revealHold);
    }
    return () => window.clearTimeout(timer);
  }, [scene, introPhase, count]);

  useEffect(() => {
    let timer: number | undefined;
    if (scene === 'code' && introPhase === 'ready') {
      timer = window.setTimeout(() => setScene('welcome'), config.durations.revealAfter);
    } else if (scene === 'welcome') {
      timer = window.setTimeout(() => setScene('album'), config.durations.welcomeHold);
    } else if (scene === 'album' && !albumOpen && photoIndex === 0) {
      timer = window.setTimeout(() => setAlbumOpen(true), config.durations.albumOpenDelay);
    } else if (scene === 'album' && albumOpen && !pageTurning) {
      const hold = photoIndex === 0 ? config.durations.photoOneHold : config.durations.photoTwoHold;
      timer = window.setTimeout(nextPhoto, hold);
    } else if (scene === 'wish' && showStarResponse) {
      timer = window.setTimeout(() => setScene('finale'), config.durations.starHold);
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [scene, introPhase, albumOpen, photoIndex, pageTurning, showStarResponse]);

  const replay = () => {
    clearInteractionTimers();
    setScene('code');
    setIntroPhase('count');
    setCount(1);
    setAlbumOpen(false);
    setPhotoIndex(0);
    setPageTurning(false);
    setCakeWished(false);
    setRoseMessage(false);
    setLetterOpen(false);
    setTypedLetter('');
    setStarLaunched(false);
    setShowStarResponse(false);
    setHeart(heartCode());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="story-root" style={themeStyle} data-testid="birthday-story">
      {scene === 'code' && (
        <section className="code-scene" data-testid="scene-code-opening">
          <CodeRain /><div className="code-vignette" />
          <div className="code-content" key={`${introPhase}-${count}`}>
            <div className="eyebrow">a little birthday transmission</div>
            {introPhase === 'count' && <div className="count-number" data-testid="countdown-number">{count}</div>}
            {introPhase === 'heart' && (
              <pre className="code-heart" data-testid="character-heart">
                {heart.split('\n').map((row, rowIndex) => (
                  <span className="heart-row" key={`row-${rowIndex}`}>
                    {Array.from(row).map((character, columnIndex) => (
                      <span
                        className="heart-character"
                        style={{ animationDelay: `${rowIndex * 115 + columnIndex * 4}ms` }}
                        key={`cell-${columnIndex}`}
                      >
                        {character}
                      </span>
                    ))}
                  </span>
                ))}
              </pre>
            )}
            {(introPhase === 'reveal' || introPhase === 'ready') && (
              <>
                <h1 className="code-title" data-testid="birthday-reveal"><RevealLine text={config.copy.mainTitle} /><strong><RevealLine text={config.copy.mainName} /></strong></h1>
                {introPhase === 'ready' && <p className="code-love">{config.copy.openingLine}</p>}
              </>
            )}
            {introPhase === 'ready' && <button className="primary-action fade-in" onClick={() => setScene('welcome')} data-testid="button-open-surprise">CONTINUE TO YOUR GIFT</button>}
          </div>
        </section>
      )}

      {scene === 'welcome' && (
        <section className="stage" data-testid="scene-welcome">
          <RosePetals />
          <div className="stage-inner">
            <p className="stage-kicker">just for you, Natali</p>
            <h1 className="stage-title">{config.copy.welcome}</h1>
            <p className="stage-copy">{config.copy.celebration}</p>
            <button className="primary-action" onClick={() => setScene('album')} data-testid="button-open-album">OPEN YOUR ALBUM</button>
          </div>
        </section>
      )}

      {scene === 'album' && (
        <section className="stage" data-testid="scene-album">
          <div className="stage-inner">
            <p className="stage-kicker">a keepsake, made with love</p>
            <h1 className="stage-title">{config.copy.albumTitle}</h1>
            <p className="memories-line">{config.copy.albumSubtitle}</p>
            <div
              className="album-wrap"
              onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
              onTouchEnd={(event) => {
                const end = event.changedTouches[0]?.clientX;
                if (touchStartX.current !== null && end !== undefined && Math.abs(end - touchStartX.current) > 45) nextPhoto();
                touchStartX.current = null;
              }}
            >
              <div className={`album ${albumOpen ? 'is-open' : ''} ${pageTurning ? 'page-turning' : ''}`} data-testid="album-book">
                <div className="album-spine" />
                <div className={`album-page ${photoIndex === 0 ? 'current' : ''}`}>
                  <img className="album-photo" src={config.images.portraits[0]} alt="Natali in a playful birthday-filter portrait" data-testid="portrait-natali-1" />
                  <p className="photo-caption" data-testid="text-caption-1">{config.copy.captions[0]}</p>
                </div>
                <div className={`album-page ${photoIndex === 1 ? 'current' : ''}`}>
                  <img className="album-photo" src={config.images.portraits[1]} alt="A close-up portrait of Natali smiling" data-testid="portrait-natali-2" />
                  <p className="photo-caption" data-testid="text-caption-2">{config.copy.captions[1]}</p>
                </div>
                <div className="album-cover"><div><div className="eyebrow">a keepsake for</div><div className="cover-name">{config.copy.albumCoverName}</div></div><span className="cover-heart">♡</span></div>
              </div>
            </div>
            <p className="album-hint">{albumOpen ? `PAGE ${photoIndex + 1} OF 2 · SWIPE OR TAP TO TURN` : 'TAP TO OPEN YOUR ALBUM'}</p>
            <button className="primary-action" onClick={nextPhoto} data-testid="button-turn-album">{albumOpen ? (photoIndex === 1 ? 'CLOSE THE ALBUM' : 'TURN THE PAGE') : 'OPEN THE ALBUM'}</button>
          </div>
        </section>
      )}

      {scene === 'cake' && (
        <section className={`stage ${cakeWished ? 'is-wished' : ''}`} data-testid="scene-cake-bouquet">
          <div className="stage-inner">
            <p className="stage-kicker">a little something sweet</p>
            <h1 className="stage-title">{config.copy.surprise}</h1>
            <p className="stage-copy gift-heading">{config.copy.giftHeading}</p>
            <CakeAndBouquet wished={cakeWished} roseMessage={roseMessage} onTapRoses={() => setRoseMessage(true)} />
            <button className="primary-action wish-button" onClick={() => setCakeWished(true)} data-testid="button-make-wish">{config.copy.wishButton}</button>
            {cakeWished && <p className="message-prompt fade-in" data-testid="text-wish-response">{config.copy.wishResponse}</p>}
            <button className="quiet-action" onClick={() => setRoseMessage(true)} data-testid="button-tap-roses">TAP THE ROSES</button>
            {roseMessage && <p className="message-prompt fade-in" data-testid="text-rose-message">{config.copy.roseMessage}</p>}
            {(cakeWished || roseMessage) && <button className="primary-action fade-in" onClick={() => setScene('letter')} data-testid="button-continue-letter">THERE'S A LETTER FOR YOU</button>}
          </div>
        </section>
      )}

      {scene === 'letter' && (
        <section className="stage" data-testid="scene-letter">
          <div className="stage-inner">
            <p className="stage-kicker">{config.copy.letterIntro}</p>
            <button className={`envelope ${letterOpen ? 'open' : ''}`} onClick={() => setLetterOpen((open) => !open)} aria-label={letterOpen ? 'Close the birthday letter' : 'Open the birthday letter'} data-testid="button-open-letter">
              <span className="envelope-flap" /><span className="seal">♥</span>
            </button>
            {!letterOpen && <p className="tiny-note">A LITTLE NOTE, SEALED WITH LOVE · TAP TO OPEN</p>}
            {letterOpen && (
              <article className="letter" data-testid="letter-content" aria-live="polite">
                <p className="typed-letter" data-testid="text-secret-letter">{typedLetter}</p>
                <p className="signature" data-testid="text-letter-signature">{config.secretLetter.signature}</p>
              </article>
            )}
            {letterOpen && <button className="primary-action" onClick={() => setScene('wish')} data-testid="button-continue-wish">ONE LAST WISH</button>}
          </div>
        </section>
      )}

      {scene === 'wish' && (
        <section className="stage" data-testid="scene-wishing-star">
          <div className="stage-inner">
            <p className="stage-kicker">the night is yours</p>
            <h1 className="stage-title">{config.copy.starPrompt}</h1>
            <div className={`star-field ${starLaunched ? 'is-launched' : ''}`}>
              <svg className="star-trail" viewBox="0 0 240 150" aria-hidden="true">
                <path d="M120 126 C92 101 35 69 35 41 C35 13 69 9 91 31 C103 13 137 13 149 31 C171 9 205 13 205 41 C205 69 148 102 120 126Z" fill="none" stroke="#d95184" strokeWidth="3" />
              </svg>
              <button className={`wish-star ${starLaunched ? 'launched' : ''}`} onClick={launchStar} aria-label="Send your wish into the sky" data-testid="button-send-wish">✦</button>
            </div>
            {showStarResponse && <p className="stage-copy fade-in" data-testid="text-star-response">{config.copy.starResponse}</p>}
            {showStarResponse && <button className="primary-action" onClick={() => setScene('finale')} data-testid="button-see-finale">ONE LAST SURPRISE</button>}
          </div>
        </section>
      )}

      {scene === 'finale' && (
        <section className="stage" data-testid="scene-finale">
          <div className="fireworks" aria-hidden="true"><i className="burst" /><i className="burst" /><i className="burst" /><span className="finale-heart">♥</span><span className="finale-star">✦</span><span className="finale-confetti">✦</span></div>
          <div className="stage-inner">
            <p className="stage-kicker">made just for you</p>
            <h1 className="finale-title">{config.copy.finaleHeading}</h1>
            <p className="finale-copy">{config.copy.finaleLine}</p>
            <p className="stage-copy">{config.copy.openingLine}</p>
            <button className="primary-action" onClick={replay} data-testid="button-replay">REPLAY YOUR SURPRISE ↻</button>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
