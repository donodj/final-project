import { useEffect, useState } from "react";

const Difficulty = {
  Easy: 0,
  Normal: 1,
  Hard: 2
};

type SettingsState = {
  selectedGens: Array<boolean>,
  difficulty: number
}

const GENERATIONS: number = 9;
const SETTINGS_KEY = "AppSettings"

export function Settings() {
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    // Load settings if there are saved settings
    return saved
      ? JSON.parse(saved)
      : { selectedGens: Array(GENERATIONS).fill(true), Difficulty: Difficulty.Normal };
  });

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleGenChange = (idx: number) => {
    setSettings(prev => ({
      ...prev,
      selectedGens: prev.selectedGens.map((val, i) => (i === idx ? !val : val))
    }));
    console.log(`Toggled gen ${idx + 1}`)
  };

  const handleDifficultyChange = (newDiff: number) => {
    setSettings(prev => ({
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
        {Array.from({length: GENERATIONS}, (_, idx) => (
          <label key={idx}>
            <input
              type="checkbox"
              checked={settings.selectedGens[idx]}
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
                checked={settings.difficulty === val}
                onChange={() => handleDifficultyChange(val)}
              />
              {key}
            </label>
          ) : null
        )}
      </div>
    </div>
  );
}