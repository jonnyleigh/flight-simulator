// Predefined Level of Detail settings

export const lodPresets = [
    {
        name: 'Low',
        chunkSize: 2000,    // meters
        drawDistance: 3,    // chunks radius
        segments: 16        // grid subdivs per chunk
    },
    {
        name: 'Medium',
        chunkSize: 2000,
        drawDistance: 5,
        segments: 32
    },
    {
        name: 'High',
        chunkSize: 2000,
        drawDistance: 8,
        segments: 64
    }
];

export function getLODSettings(gameState) {
    const idx = gameState.settings.lod;
    if (idx >= 0 && idx < lodPresets.length) {
        return lodPresets[idx];
    }
    return lodPresets[1]; // Default to medium
}
