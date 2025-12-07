import type React from "react";
import { Globals } from "./Globals";
import "./GameSettings.css";

export const Difficulty = {
  Easy: 0,
  Normal: 1,
  Hard: 2
} as const;

export type GameSettingsState = {
  selectedGens: Array<boolean>,
  difficulty: number,
  isExactSpelling: boolean,
};

type Props = {
  gameSettings: GameSettingsState;
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettingsState>>;
  clearData: () => void;
}

function GameSettings({gameSettings, setGameSettings, clearData}: Props) {
  const handleGenChange = (idx: number) => {
    setGameSettings(prev => ({
      ...prev,
      selectedGens: prev.selectedGens.map((val, i) => (i === idx ? !val : val))
    }));
    console.log(`Toggled gen ${idx + 1}`)
  };

  const handleDifficultyChange = (newDiff: number) => {
    setGameSettings(prev => ({
      ...prev,
      difficulty: newDiff
    }));
    console.log(`Difficulty changed to ${newDiff}`)
  };

  const handleSpellingChange = (newState: boolean) => {
    setGameSettings(prev => ({
      ...prev,
      isExactSpelling: newState
    }));
    console.log(`Exact spelling changed to ${newState}`);
  }

  return (
    <div className="settings-container">
      <h1 className="settings-title">Settings</h1>

      <hr></hr>

      <h2 className="setting-header">Generations</h2>
      <div className="gen-buttons">
        {Array.from({length: Globals.MAX_GEN}, (_, idx) => (
          <label key={idx}>
            <input
              className="check-button"
              type="checkbox"
              checked={gameSettings.selectedGens[idx]}
              onChange={() => handleGenChange(idx)}
            />
            Gen {idx + 1}
          </label>
        ))}
      </div>

      <hr></hr>

      <h2 className="setting-header">Difficulty</h2>
      <div className="difficulty-buttons">
        {Object.entries(Difficulty).map(([key, val]) =>
          typeof val === "number" ? (
            <label key={val}>
              <input
                className="radio-button"
                type="radio"
                name="difficulty"
                value={val}
                checked={gameSettings.difficulty === val}
                onChange={() => handleDifficultyChange(val)}
              />
              {key}
            </label>
          ) : null
        )}
      </div>

      <hr></hr>

      <h2 className="setting-header">Exact Spelling</h2>
      <label>
        <input
          className="check-button"
          type="checkbox"
          checked={gameSettings.isExactSpelling}
          onChange={() => handleSpellingChange(!gameSettings.isExactSpelling)}
        />
        On
      </label>

      <hr></hr>

      <button className="reset-button" onClick={clearData}>Clear Data</button>
    </div>
  );
};

export default GameSettings;
