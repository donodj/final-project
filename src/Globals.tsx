export const Globals = {
  MAX_GEN: 9,

  randomArrElement: <T,>(arr: T[]) => {
    if (!arr || arr.length <= 0) {
      console.error('Failed to get random value, list is null or empty');
      return null;
    }
    return arr[Math.floor(Math.random() * arr.length)];
  },

  getFormattedPokemonName: (name: string) => {
    return name
      // Remove gender tag
      .replace(/-(f|m)$/, "")
      // Replace hyphens with space
      .replaceAll("-", " ")
      // Capitalize each word
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
      .trim();
  },
}