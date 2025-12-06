import { useEffect, useRef, useState } from 'react';
import { getTimeString, useStopwatch } from './Stopwatch';

export type Pokemon = {
  id: number;
  name: string;
}

const getSpriteUrl = (pokemon: Pokemon) => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
}

const NULL_POKEMON: Pokemon = {
  id: 0,
  name: 'MISSINGNO.'
};

const API_URL: string = 'https://pokeapi.co/api/v2/pokemon-species?limit=9999';

export function usePokemonGame() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { elapsedTime, startTimer, stopTimer, resetTimer } = useStopwatch();
  const [pokemonList, setPokemonData] = useState<Pokemon[]>([]);
  const [currentPokemon, setCurrentPokemon] = useState(NULL_POKEMON);
  const [isPokemonHidden, setIsPokemonHidden] = useState(true);
  const [guessEntry, setGuessEntry] = useState("");

  useEffect(() => {
    updatePokemonList();
  }, []);

  useEffect(() => {
    if (pokemonList.length > 0) {
      newPokemon();
    }
  }, [pokemonList]);

  const updatePokemonList = async () => {
    console.log('Getting Pokemon list...');
    const response = await fetch(API_URL);
    const data = await response.json();

    const newList: Pokemon[] = data.results.map((item: any, index: number) => ({
      id: index + 1,
      name: item.name
    }));

    if (newList.length <= 0) {
      console.warn('Pokemon list returned empty');
    }

    setPokemonData(newList);
  };

  const getRandPokemon = () => {
    if (pokemonList.length <= 0) {
      console.error('Error: Could not select Pokemon, list is empty');
      return NULL_POKEMON;
    } else {
      let randIdx: number = Math.floor(Math.random() * pokemonList.length);
      return pokemonList[randIdx];
    }
  }

  const revealPokemon = () => {
    setIsPokemonHidden(false);
    stopTimer();
  }

  const newPokemon = () => {
    console.log('Getting new Pokemon...');
    setCurrentPokemon(getRandPokemon());
    setIsPokemonHidden(true);
    if (inputRef.current){
      inputRef.current.value = "";
    }
    resetTimer();
    startTimer();
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
    console.log(elapsedTime);
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
    handleGuessEntryChange,
    checkGuess,
    revealPokemon,
    newPokemon,
    getSpriteUrl,
    getTimeString,
  };
}
