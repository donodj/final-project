import { usePokemonGame } from './usePokemonGame';
import { Settings } from './Settings';
import './App.css'

function App() {
  const {
    inputRef,
    elapsedTime,
    currentPokemon,
    isPokemonHidden,
    guessEntry,
    handleGuessEntryChange,
    checkGuess,
    revealPokemon,
    newPokemon,
    getSpriteUrl,
    getTimeString,
  } = usePokemonGame();

  return (
    <>
      <header>
        <h1>Who's That Pokémon?</h1>
      </header>

      <p>It's {currentPokemon.name}</p>

      <div className='sprite-container'>
          <img
            className='sprite'
            src={getSpriteUrl(currentPokemon)}
            style={{filter: isPokemonHidden? 'brightness(0)' : 'brightness(1)'}}
          />
      </div>

      <div className='submit-container'>
        <input
          value={guessEntry}
          onChange={handleGuessEntryChange}
          placeholder='Guess the name...'
          ref={inputRef}
        />
        <button onClick={checkGuess} disabled={!isPokemonHidden}>Submit</button>

        <div className='bottom-buttons'>
          <button onClick={revealPokemon}>Reveal</button>
          <button onClick={newPokemon}>New Pokemon</button>
        </div>
      </div>

      <p className='time-data'>{getTimeString(elapsedTime)}</p>

      <Settings />
    </>
  )
}

export default App;
