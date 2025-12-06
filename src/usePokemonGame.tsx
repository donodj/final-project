import { useEffect, useRef, useState } from 'react';
import { Globals } from './Globals';
import { getTimeString, useStopwatch } from './Stopwatch';
import { Difficulty, type GameSettingsState } from './GameSettings';
import { GameClient, PokemonClient } from 'pokenode-ts';
import levenshtein from 'js-levenshtein';

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

const MIN_SPELLING_MATCH = 0.75;

const STATS_KEY = "GameStats";
type GameStats = {
  bestTime: number;
  totalGuesses: number;
  correctGuesses: number;
};

const gameClient = new GameClient();
const pokeClient = new PokemonClient();

export function usePokemonGame(gameSettings: GameSettingsState) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const pokemonGens = useRef<Pokemon[][]>([]);
  
  const [currentPokemon, setCurrentPokemon] = useState(NULL_POKEMON);
  const [isPokemonHidden, setIsPokemonHidden] = useState(true);
  const [isAwaitingAnswer, setIsAwaitingAnswer] = useState(false);
  const [isWrongMsgActive, setIsWrongMsgActive] = useState(false);
  const [guessEntry, setGuessEntry] = useState("");

  const {elapsedTime, startTimer, stopTimer, resetTimer} = useStopwatch();
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return { bestTime: -1, totalGuesses: 0, correctGuesses: 0 };
  });

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

  useEffect(() => {
    if (isAwaitingAnswer && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAwaitingAnswer, currentPokemon]);

  const updateStats = (newStats: Partial<GameStats>) => {
    setStats(prev => {
      const updated = { ...prev, ...newStats };
      localStorage.setItem(STATS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

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

    setIsWrongMsgActive(false);

    resetTimer();
    // startTimer();
    setIsAwaitingAnswer(true);
  };

  const handleGuessEntryChange = (event: any) => {
    setGuessEntry(event.target.value);
  };

  const checkGuess = () => {
    // Remove all whitespace and hyphens
    let formattedName = currentPokemon.name.replace(/-(f|m)$/, "").replace(/[\s-]+/g, "").trim().toLowerCase();
    let formattedGuess = guessEntry.replace(/[\s-]+/g, "").trim().toLowerCase();

    if (gameSettings.isExactSpelling) {
      if (formattedName === formattedGuess) {
        onCorrectGuess();
      } else {
        onWrongGuess();
      }

    } else {
      // Determine if the strings are close enough in spelling
      const maxLen = Math.max(formattedName.length, formattedGuess.length);
      const dist = levenshtein(formattedName, formattedGuess);
      const matchRatio = (maxLen - dist) / maxLen;
      console.log(`${matchRatio} of guess characters matched name`);
      if (matchRatio >= MIN_SPELLING_MATCH) {
        onCorrectGuess();
      } else {
        onWrongGuess();
      }
    }
    updateStats({totalGuesses: stats.totalGuesses + 1});
  };

  const onCorrectGuess = () => {
    revealPokemon();
    setIsWrongMsgActive(false);
    setIsAwaitingAnswer(false);
    console.log(`Guess time: ${elapsedTime}`);

    let newStats: Partial<GameStats> = {correctGuesses: stats.correctGuesses + 1};
    if (stats.bestTime < 0 || elapsedTime < stats.bestTime) {
      newStats.bestTime = elapsedTime;
      console.log(`New best time: ${elapsedTime}`);
    }
    updateStats(newStats);
  };

  const onWrongGuess = () => {
    setIsWrongMsgActive(true);
  };

  return {
    inputRef,
    currentPokemon,
    isPokemonHidden,
    isAwaitingAnswer,
    isWrongMsgActive,
    guessEntry,
    elapsedTime,
    bestTime: stats.bestTime,
    totalGuesses: stats.totalGuesses,
    correctGuesses: stats.correctGuesses,
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
