import { useEffect, useRef, useState } from 'react';
import { Globals } from './Globals';
import { getTimeString, useStopwatch } from './Stopwatch';
import { Difficulty, type GameSettingsState } from './GameSettings';
import { GameClient, PokemonClient } from 'pokenode-ts';

export type Pokemon = {
  id: number;
  name: string;
}

const getSpriteUrl = (pokemon: Pokemon) => {
  const spriteId = Math.max(pokemon.id, 0);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteId}.png`;
}

const NULL_POKEMON: Pokemon = {
  id: 0,
  name: 'MISSINGNO.',
};

const gameClient = new GameClient();
const pokeClient = new PokemonClient();

export function usePokemonGame(gameSettings: GameSettingsState) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { elapsedTime, startTimer, stopTimer, resetTimer } = useStopwatch();
  const pokemonGens = useRef<Pokemon[][]>([]);
  const [currentPokemon, setCurrentPokemon] = useState(NULL_POKEMON);
  const [isPokemonHidden, setIsPokemonHidden] = useState(true);
  const [isAwaitingAnswer, setIsAwaitingAnswer] = useState(false);
  const [guessEntry, setGuessEntry] = useState("");

  useEffect(() => {
    const initializePokemonLists = async () => {
      console.log('Getting Pokemon lists...');

      pokemonGens.current = [];

      // Get a list for each selected gen
      for (let i = 0; i < Globals.MAX_GEN; i++) {
        const genData = await gameClient.getGenerationById(i + 1);

        const newList: Pokemon[] = genData.pokemon_species.map((item: any, _) => ({
          id: -1, // Is set later to save on API calls
          name: item.name,
        }));
        console.log(`Gen ${i + 1}: ${newList.length} Pokemon`);
        pokemonGens.current.push(newList);
      }

      loadNewPokemon();
      console.log(pokemonGens.current);
    };

    initializePokemonLists();
  }, []);

  const getRandPokemon = async () => {
    // Get list of selected generations to pull Pokemon from
    let genChoices: number[] = [];
    gameSettings.selectedGens.forEach((val, idx) => {
      if (val) genChoices.push(idx);
    });
    // Choose random generation
    const randIdx = Globals.randomArrElement(genChoices);
    if (randIdx === null) {
      return NULL_POKEMON;
    }
    console.log(`Choosing Pokemon from Gen ${randIdx + 1}`)
    // Get random Pokemon in that generation
    const randPokemon = Globals.randomArrElement(pokemonGens.current[randIdx]);
    if (randPokemon) {
      // Set the id if not already set
      if (randPokemon.id < 0) {
        randPokemon.id = (await pokeClient.getPokemonSpeciesByName(randPokemon.name)).id;
      }
      return randPokemon;
    } else {
      // If failed to pick, return null pokemon
      return NULL_POKEMON;
    }
  }

  const isPokemonValid = (pokemon: Pokemon = currentPokemon) => {
    return pokemon.id > 0;
  };

  const revealPokemon = () => {
    setIsPokemonHidden(false);
    setIsAwaitingAnswer(false);
    stopTimer();
  }

  const loadNewPokemon = async () => {
    console.log('Getting new Pokemon...');

    const newPokemon = await getRandPokemon();

    if (!isPokemonValid(newPokemon)) {
      console.log("Tried setting to a null pokemon");
      alert("Please select at least one Generation!")
      return;
    }

    setCurrentPokemon(newPokemon);

    // Hide the Pokemon if not in easy difficulty
    setIsPokemonHidden(gameSettings.difficulty != Difficulty.Easy);

    if (inputRef.current){
      setGuessEntry("");
    }

    resetTimer();
    // startTimer();
    setIsAwaitingAnswer(true);
  };

  const handleGuessEntryChange = (event: any) => {
    setGuessEntry(event.target.value);
  };

  const checkGuess = () => {
    // Remove all whitespace and hyphens
    let formattedName = currentPokemon.name.replace(/[\s-]+/g, "").trim().toLowerCase();
    let formattedGuess = guessEntry.replace(/[\s-]+/g, "").trim().toLowerCase();

    if (formattedName === formattedGuess) {
      onCorrectGuess();
    } else {
      onWrongGuess();
    }
  };

  const onCorrectGuess = () => {
    revealPokemon();
    setIsAwaitingAnswer(false);
    console.log(`Guess time: ${elapsedTime}`);
  };

  const onWrongGuess = () => {
    ;
  };

  return {
    inputRef,
    elapsedTime,
    currentPokemon,
    isPokemonHidden,
    guessEntry,
    isAwaitingAnswer,
    getSpriteUrl,
    getTimeString,
    startTimer,
    stopTimer,
    resetTimer,
    isPokemonValid,
    revealPokemon,
    loadNewPokemon,
    handleGuessEntryChange,
    checkGuess,
  };
}
