import type { FormEvent } from 'react';
import { birthdayConfig as config } from '../config';

export type PreludeScene = 'passcode' | 'unlocking' | 'loveMessage' | 'secretWish' | 'wishSent';

type BirthdayPreludeProps = {
  scene: PreludeScene;
  passcode: string;
  onPasscodeChange: (passcode: string) => void;
  onUnlock: (event: FormEvent<HTMLFormElement>) => void;
  unlockPending: boolean;
  unlockError: string;
  visibleLoveParagraphs: number;
  wishMessage: string;
  onWishMessageChange: (message: string) => void;
  onSubmitWish: (event: FormEvent<HTMLFormElement>) => void;
  sendingWish: boolean;
  wishError: string;
  honeypot: string;
  onHoneypotChange: (value: string) => void;
  onContinue: () => void;
};

const sparkleGlyphs = ['♥', '✦', '♡', '✧', '♥', '✦', '♡', '✧', '♥', '✦', '♡', '✧'];

export function BirthdayPrelude({
  scene,
  passcode,
  onPasscodeChange,
  onUnlock,
  unlockPending,
  unlockError,
  visibleLoveParagraphs,
  wishMessage,
  onWishMessageChange,
  onSubmitWish,
  sendingWish,
  wishError,
  honeypot,
  onHoneypotChange,
  onContinue,
}: BirthdayPreludeProps) {
  if (scene === 'passcode') {
    return (
      <section className="stage gate-stage" data-testid="scene-birthday-passcode">
        <div className="prelude-hearts" aria-hidden="true">
          {sparkleGlyphs.slice(0, 8).map((glyph, index) => <i key={index}>{glyph}</i>)}
        </div>
        <div className="stage-inner gate-content">
          <div className="gate-lock" aria-hidden="true"><span>♡</span></div>
          <p className="stage-kicker">a little birthday secret</p>
          <h1 className="wish-form-title" id="wish-gate-title">{config.copy.wishGateTitle}</h1>
          <p className="wish-form-copy">{config.copy.wishGateCopy}</p>
          <p className="wish-hint">{config.copy.wishPasscodeHint}</p>
          <form className="wish-form gate-form" onSubmit={onUnlock}>
            <label className="wish-field-label" htmlFor="wish-passcode">{config.copy.wishPasscodeLabel}</label>
            <input
              className="wish-input passcode-input"
              id="wish-passcode"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              autoComplete="off"
              value={passcode}
              onChange={(event) => onPasscodeChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
              aria-describedby="wish-passcode-hint"
              required
              data-testid="input-wish-passcode"
            />
            <span id="wish-passcode-hint" className="sr-only">{config.copy.wishPasscodeHint}</span>
            <button className="primary-action" type="submit" disabled={unlockPending} data-testid="button-unlock-wish-form">
              {unlockPending ? 'OPENING…' : config.copy.wishUnlockButton}
            </button>
          </form>
          {unlockError && <p className="wish-form-status error" role="alert" data-testid="text-wish-error">{unlockError}</p>}
        </div>
      </section>
    );
  }

  if (scene === 'unlocking') {
    return (
      <section className="stage unlocking-scene" data-testid="scene-heart-unlock" aria-live="polite">
        <div className="unlock-particles" aria-hidden="true">
          {sparkleGlyphs.map((glyph, index) => <i key={index}>{glyph}</i>)}
        </div>
        <div className="unlock-content">
          <div className="opening-lock" aria-hidden="true">
            <span className="lock-shackle" />
            <span className="lock-body"><i>♥</i></span>
          </div>
          <div className="unlock-heart" aria-hidden="true">♥</div>
          <h1 className="unlock-headline">{config.copy.unlockingHeadline}</h1>
        </div>
      </section>
    );
  }

  if (scene === 'loveMessage') {
    const allRevealed = visibleLoveParagraphs >= config.personalLoveMessage.paragraphs.length;
    return (
      <section className="stage love-scene" data-testid="scene-personal-love-message">
        <div className="love-letter-card">
          <p className="wish-form-kicker">a little note, written just for you</p>
          <h1 className="wish-form-title">{config.copy.loveMessageHeading}</h1>
          <div className="love-letter-body" aria-live="polite">
            <p className="love-greeting fade-in">{config.personalLoveMessage.greeting}</p>
            {config.personalLoveMessage.paragraphs.slice(0, visibleLoveParagraphs).map((paragraph, index) => (
              <p className="love-paragraph" key={index}>{paragraph}</p>
            ))}
            {allRevealed && <p className="love-signature fade-in">{config.personalLoveMessage.signature}</p>}
          </div>
          {allRevealed && (
            <button className="primary-action love-continue" type="button" onClick={onContinue} data-testid="button-continue-secret-wish">
              {config.copy.loveMessageButton}
            </button>
          )}
        </div>
        <div className="love-card-hearts" aria-hidden="true"><i>♡</i><i>♥</i><i>✧</i></div>
      </section>
    );
  }

  if (scene === 'secretWish') {
    return (
      <section className="stage secret-wish-stage" data-testid="scene-secret-birthday-wish">
        <div className="wish-screen-sparkles" aria-hidden="true"><i>✦</i><i>♡</i><i>✧</i><i>♥</i><i>✦</i></div>
        <div className="secret-wish-content">
          <div className="wish-star-emblem" aria-hidden="true">✦</div>
          <p className="stage-kicker">your little wish is safe with me</p>
          <h1 className="stage-title secret-wish-title">{config.copy.secretWishHeading}</h1>
          <div className="secret-wish-prompt">
            {config.secretWishPrompt.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <form className="secret-wish-form" onSubmit={onSubmitWish}>
            <label className="sr-only" htmlFor="secret-wish-message">{config.copy.secretWishLabel}</label>
            <textarea
              className="wish-input wish-textarea secret-wish-input"
              id="secret-wish-message"
              maxLength={500}
              placeholder={config.copy.secretWishPlaceholder}
              value={wishMessage}
              onChange={(event) => onWishMessageChange(event.target.value.slice(0, 500))}
              aria-describedby="wish-character-count"
              required
              data-testid="input-wish-message"
            />
            <div className="wish-form-meta">
              <span className="wish-private-note">Your wish is private and will only be emailed to the site owner.</span>
              <span className="wish-counter" id="wish-character-count">{wishMessage.length}/500</span>
            </div>
            <label className="wish-honeypot" aria-hidden="true">
              Leave this field empty
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => onHoneypotChange(event.target.value)}
              />
            </label>
            <button className="primary-action secret-wish-submit" type="submit" disabled={sendingWish} data-testid="button-send-birthday-wish">
              {sendingWish ? config.copy.wishSending : config.copy.secretWishButton}
            </button>
          </form>
          {wishError && <p className="wish-form-status error" role="alert" data-testid="text-wish-error">{wishError}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="stage wish-success-stage" data-testid="scene-wish-sent" aria-live="polite">
      <div className="wish-success-animation" aria-hidden="true">
        <svg className="wish-success-trail" viewBox="0 0 260 180">
          <path d="M130 147 C101 122 37 81 37 48 C37 14 78 10 103 37 C117 18 143 18 157 37 C182 10 223 14 223 48 C223 81 159 122 130 147Z" />
        </svg>
        <span className="wish-success-star">✦</span>
      </div>
      <div className="stage-inner wish-success-content">
        <p className="stage-kicker">sent with a little bit of magic</p>
        <h1 className="finale-title">{config.copy.wishSuccessHeading}</h1>
        <p className="stage-copy">{config.copy.wishSuccessCopy}</p>
        <button className="primary-action" type="button" onClick={onContinue} data-testid="button-continue-birthday">
          {config.copy.continueBirthdayButton}
        </button>
      </div>
    </section>
  );
}
