import { useEffect, useState } from 'react';
import { Globals } from './Globals';
import { usePokemonGame } from './usePokemonGame';
import GameSettings, { Difficulty } from './GameSettings';
import type { GameSettingsState } from './GameSettings';
import './App.css'

const GAME_SETTINGS_KEY = "GameSettings";

function App() {
  const [gameSettings, setGameSettings] = useState<GameSettingsState>(() => {
    const saved = localStorage.getItem(GAME_SETTINGS_KEY);
    return saved
      ? JSON.parse(saved)
      : { selectedGens: Array(Globals.MAX_GEN).fill(true), difficulty: Difficulty.Normal };
  });

  const [isImgLoaded, setIsImgLoaded] = useState(false);

  const {
    inputRef,
    elapsedTime,
    currentPokemon,
    isPokemonHidden,
    guessEntry,
    isAwaitingAnswer,
    getSpriteUrl,
    getTimeString,
    startTimer,
    // stopTimer,
    // resetTimer,
    isPokemonValid,
    revealPokemon,
    loadNewPokemon,
    handleGuessEntryChange,
    checkGuess,
  } = usePokemonGame(gameSettings);

  useEffect(() => {
    localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(gameSettings));
  }, [gameSettings]);

  useEffect(() => {
    setIsImgLoaded(false);
  }, [currentPokemon]);

  return (
    <>
      <header>
        <h1>Who's That Pokémon?</h1>
      </header>

      <div className='sprite-container'>
        <img
          className='sprite'
          src={getSpriteUrl(currentPokemon)}
          onLoad={() => {
            setIsImgLoaded(true);
            if (isPokemonValid()) startTimer();
          }}
          style={{
            filter: isPokemonHidden ? 'brightness(0)' : 'brightness(1)',
            visibility: isImgLoaded && isPokemonValid() ? 'visible' : 'hidden'
          }}
        />
        <span
          className='overlay-text'
          style={{visibility: !isImgLoaded || !isPokemonValid() ? 'visible' : 'hidden'}}
        >
          Loading...
        </span>

        <p style={{visibility: isAwaitingAnswer || !isPokemonValid() ? 'hidden' : 'visible'}}>
          It's {Globals.getFormattedPokemonName(currentPokemon.name)}!
        </p>
      </div>

      <div className='submit-container'>
        <input
          value={guessEntry}
          onChange={handleGuessEntryChange}
          onKeyDown={e => {
            if (e.key === "Enter") checkGuess();
          }}
          disabled={!isAwaitingAnswer}
          placeholder='Guess the name...'
          ref={inputRef}
        />
        <button onClick={checkGuess} disabled={!isAwaitingAnswer}>Submit</button>

        <p className='time-data'>{`Time: ${getTimeString(elapsedTime)} sec`}</p>

        <div className='control-buttons'>
          <button onClick={revealPokemon} disabled={!isAwaitingAnswer}>Reveal</button>
          <button onClick={loadNewPokemon}>New Pokémon</button>
        </div>
      </div>

      <GameSettings
        gameSettings={gameSettings}
        setGameSettings={setGameSettings}
      />
    </>
  )
}

export default App;
