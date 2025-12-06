import { useEffect, useState } from 'react';
import { Globals } from './Globals';
import { GuessOutcome, usePokemonGame } from './usePokemonGame';
import GameSettings, { Difficulty, type GameSettingsState } from './GameSettings';
import './App.css'

const GAME_SETTINGS_KEY = "GameSettings";

function App() {
  const [gameSettings, setGameSettings] = useState<GameSettingsState>(() => {
    const saved = localStorage.getItem(GAME_SETTINGS_KEY);
    return saved
      ? JSON.parse(saved)
      : { selectedGens: Array(Globals.MAX_GEN).fill(true), difficulty: Difficulty.Normal, isExactSpelling: false };
  });

  const [isImgLoaded, setIsImgLoaded] = useState(false);

  const {
    inputRef,
    currentPokemon,
    isPokemonHidden,
    isAwaitingAnswer,
    guessOutcome,
    guessEntry,
    elapsedTime,
    bestTime,
    totalGuesses,
    correctGuesses,
    getSpriteUrl,
    getTimeString,
    startTimer,
    // stopTimer,
    // resetTimer,
    resetStats,
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

  const clearAllData = () => {
    localStorage.removeItem(GAME_SETTINGS_KEY);
    resetStats();
    window.location.reload();
  }

  return (
    <>
      <header>
        <img className='title' src='src/assets/title.png'></img>
      </header>

      <div className='game-container'>
        <div className='pokemon-view'>
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
          </div>

          <p className='pokemon-name' style={{visibility: isAwaitingAnswer || !isPokemonValid() ? 'hidden' : 'visible'}}>
            It's {Globals.getFormattedPokemonName(currentPokemon.name)}!
          </p>
        </div>

        <div className='submit-container'>
          {guessOutcome === GuessOutcome.Correct && (
            <p className='correct-guess-txt'>Correct!</p>
          )}
          {guessOutcome === GuessOutcome.Wrong && (
            <p className='wrong-guess-txt'>Try again!</p>
          )}
          {guessOutcome === GuessOutcome.Unset && (
            <p className='wrong-guess-txt' style={{visibility: 'hidden'}}>placeholder</p>
          )}

          <div className='guess-container'>
            <input
              className='guess-input'
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
          </div>

          <div className='stats-container'>
            <h2>Statistics</h2>
            <hr></hr>
            <p>{`Guess Time: ${getTimeString(elapsedTime)} sec`}</p>
            <p>{`Best Time: ${getTimeString(bestTime)} sec`}</p>
            <p>{`Correct Guesses: ${correctGuesses}`}</p>
            <p>{`Total Guesses: ${totalGuesses}`}</p>
            {/* Calculate accuracy if guessed at least once, else return 0 */}
            <p>{`Accuracy: ${totalGuesses > 0 ? (Math.round(correctGuesses / totalGuesses * 10000) / 100) : 0}%`}</p>
          </div>

          <div className='control-buttons'>
            <button onClick={revealPokemon} disabled={!isAwaitingAnswer}>Reveal</button>
            <button onClick={loadNewPokemon}>New Pokémon</button>
          </div>
        </div>
      </div>

      <GameSettings
        gameSettings={gameSettings}
        setGameSettings={setGameSettings}
        clearData={clearAllData}
      />
    </>
  )
}

export default App;
