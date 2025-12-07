import { useEffect, useRef, useState } from 'react';
import { Globals } from './Globals';
import { getTimeString, useStopwatch } from './Stopwatch';
import { Difficulty, type GameSettingsState } from './GameSettings';
import { GameClient } from 'pokenode-ts';
import levenshtein from 'js-levenshtein';

export type Pokemon = {
  id: number;
  name: string;
  cry: string;
}

export const GuessOutcome = {
  Unset: 0,
  Correct: 1,
  Wrong: 2
} as const

const getSpriteUrl = (pokemon: Pokemon) => {
  const spriteId = Math.max(pokemon.id, 0);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteId}.png`;
}

const NULL_POKEMON: Pokemon = {
  id: 0,
  name: 'MISSINGNO.',
  cry: "",
};

const MIN_SPELLING_MATCH = 0.75;

const STATS_KEY = "GameStats";
type GameStats = {
  bestTime: number;
  totalGuesses: number;
  correctGuesses: number;
};

const DEFAULT_STATS = {bestTime: -1, totalGuesses: 0, correctGuesses: 0};

const gameClient = new GameClient();
// const pokeClient = new PokemonClient();

export function usePokemonGame(gameSettings: GameSettingsState) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pokemonGens = useRef<Pokemon[][]>([]);

  const [currentPokemon, setCurrentPokemon] = useState(NULL_POKEMON);
  const [isPokemonHidden, setIsPokemonHidden] = useState(true);
  const [isAwaitingAnswer, setIsAwaitingAnswer] = useState(false);
  const [guessOutcome, setGuessOutcome] = useState<typeof GuessOutcome[keyof typeof GuessOutcome]>(GuessOutcome.Unset);
  const [guessEntry, setGuessEntry] = useState("");

  const {elapsedTime, startTimer, stopTimer, resetTimer} = useStopwatch();
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULT_STATS;
  });

  useEffect(() => {
    const initializePokemonLists = async () => {
      console.log('Getting Pokemon lists...');

      pokemonGens.current = [];

      // Get a list for each selected gen
      for (let i = 0; i < Globals.MAX_GEN; i++) {
        const genData = await gameClient.getGenerationById(i + 1);

        const newList: Pokemon[] = genData.pokemon_species.map((item: any, _) => ({
          // Id and cry are set later to save on API calls
          id: -1,
          name: item.name,
          cry: "",
        }));
        console.log(`Gen ${i + 1}: ${newList.length} Pokemon`);
        pokemonGens.current.push(newList);
      }

      loadNewPokemon();
      console.log(pokemonGens.current);
    };

    if (pokemonGens.current.length <= 0) {
      initializePokemonLists();
    }
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

  const resetStats = () => {
    localStorage.removeItem(STATS_KEY);
    setStats(DEFAULT_STATS);
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

    // If failed to pick, return null pokemon
    if (randPokemon === null) {
      return NULL_POKEMON;
    }

    // Set id and cry if not already set
    if (randPokemon.id < 0 || randPokemon.cry === "") {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randPokemon.name}`);
      const data = await response.json();

      randPokemon.id = data.id;

      const cries = data.cries;
      const cryUrl = cries?.latest || cries?.legacy;
      if (cryUrl) randPokemon.cry = cryUrl;
    }
      return randPokemon;
  }

  const isPokemonValid = (pokemon: Pokemon = currentPokemon) => {
    return pokemon.id > 0;
  };

  const revealPokemon = () => {
    setIsPokemonHidden(false);
    setIsAwaitingAnswer(false);
    setGuessOutcome(GuessOutcome.Unset);
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

    setGuessOutcome(GuessOutcome.Unset);

    resetTimer();
    // startTimer();
    setIsAwaitingAnswer(true);
  };

  const playPokemonCry = () => {
    if (currentPokemon.cry !== "") {
      const audio = new Audio(currentPokemon.cry);
      audio.volume = 0.33;
      audio.play();
    }
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
    setGuessOutcome(GuessOutcome.Correct);
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
    setGuessOutcome(GuessOutcome.Wrong);
  };

  return {
    inputRef,
    currentPokemon,
    isPokemonHidden,
    isAwaitingAnswer,
    guessOutcome,
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
    resetStats,
    isPokemonValid,
    revealPokemon,
    loadNewPokemon,
    playPokemonCry,
    handleGuessEntryChange,
    checkGuess,
  };
}
