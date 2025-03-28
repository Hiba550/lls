import create from 'zustand';

const useDataStore = create((set) => ({
  scannedParts: [],
  addScannedPart: (part) =>
    set((state) => ({ scannedParts: [...state.scannedParts, part] })),
  clearScannedParts: () => set({ scannedParts: [] }),
}));

export default useDataStore;