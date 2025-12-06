import type React from "react";
import { Globals } from "./Globals";

export const Difficulty = {
  Easy: 0,
  Normal: 1,
  Hard: 2
} as const;

export type GameSettingsState = {
  selectedGens: Array<boolean>,
  difficulty: number
};

type Props = {
  gameSettings: GameSettingsState;
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettingsState>>;
}

const GameSettings: React.FC<Props> = ({gameSettings, setGameSettings}) => {
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

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <h4>Generation</h4>
      <div className="gen-settings">
        {Array.from({length: Globals.MAX_GEN}, (_, idx) => (
          <label key={idx}>
            <input
              type="checkbox"
              checked={gameSettings.selectedGens[idx]}
              onChange={() => handleGenChange(idx)}
            />
            Gen {idx + 1}
          </label>
        ))}
      </div>

      <h4>Difficulty</h4>
      <div className="difficulty-settings">
        {Object.entries(Difficulty).map(([key, val]) =>
          typeof val === "number" ? (
            <label key={val}>
              <input
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
    </div>
  );
};

export default GameSettings;
