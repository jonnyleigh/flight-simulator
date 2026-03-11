import { MathUtils } from '../utils/MathUtils.js';

export class WorldGenerator {
    constructor(seed) {
        this.baseSeed = Number.isFinite(seed) ? seed : Math.floor(Math.random() * 1000000);
        MathUtils.seedSimplex(this.baseSeed);

        // Terrain generation settings
        // Tuned to create broad lowlands, coherent mountain ranges, and realistic water coverage.
        this.domainWarpScale = 0.000015;
        this.domainWarpStrength = 7000;

        // Airport flattening
        this.airportCenter = { x: 0, z: 0 };
        this.flattenRadiusInner = 2000; // Completely flat within this radius (in m)
        this.flattenRadiusOuter = 5000; // Blends to natural terrain
        this.baseAltitude = 10; // Airport sits at 10m MSL
    }

    /**
     * Gets terrain elevation at a specific world (x, z) coordinate
     * Returns height in meters
     */
    getHeightAt(x, z) {
        // Domain warp first so mountain/valley patterns don't look axis-aligned or repetitive.
        const warpX = MathUtils.simplex2(
            x * this.domainWarpScale,
            z * this.domainWarpScale
        ) * this.domainWarpStrength;
        const warpZ = MathUtils.simplex2(
            (x + 517.3) * this.domainWarpScale,
            (z - 919.1) * this.domainWarpScale
        ) * this.domainWarpStrength;

        const wx = x + warpX;
        const wz = z + warpZ;

        // 1) Continentalness (very low frequency) controls land vs sea at a large scale.
        let continental = (MathUtils.simplex2(wx * 0.000010, wz * 0.000010) + 1) * 0.5;
        continental = Math.pow(continental, 1.15);

        // Base landmass profile: tuned to reduce excessive water coverage.
        let height = (continental - 0.30) * 340;

        // 2) Rolling terrain in lowlands/hills (mid frequencies).
        const lowFreqRelief = MathUtils.simplex2(wx * 0.000045, wz * 0.000045);
        const midFreqRelief = MathUtils.simplex2(wx * 0.000110, wz * 0.000110);
        height += lowFreqRelief * 95;
        height += midFreqRelief * 35;

        // 3) Uplift mask picks regions that can become mountain ranges.
        let uplift = (MathUtils.simplex2(wx * 0.000022 + 133.7, wz * 0.000022 - 204.3) + 1) * 0.5;
        uplift = MathUtils.clamp((uplift - 0.42) / 0.58, 0, 1);
        const mountainMask = Math.pow(uplift, 1.35);

        // 4) Ridged noise builds mountain chains (not random spikes).
        const ridgeA = 1 - Math.abs(MathUtils.simplex2(wx * 0.000200, wz * 0.000200));
        const ridgeB = 1 - Math.abs(MathUtils.simplex2(wx * 0.000400, wz * 0.000400));
        let ridged = ridgeA * 0.70 + ridgeB * 0.30;
        ridged = Math.pow(MathUtils.clamp(ridged, 0, 1), 1.7);

        // Add foothill uplift + steep ridge peaks where the mask allows.
        height += mountainMask * (160 + ridged * 1200);

        // 5) Inland basins/lakes mostly in non-mountain regions.
        const basinMask = MathUtils.clamp((-lowFreqRelief - 0.15) * 2.0, 0, 1);
        height -= basinMask * 110 * (1 - mountainMask);

        // Clamp to a sensible simulation range
        height = MathUtils.clamp(height, -220, 1800);

        // Protect the airport
        const distToAirport = Math.sqrt(
            Math.pow(x - this.airportCenter.x, 2) +
            Math.pow(z - this.airportCenter.z, 2)
        );

        if (distToAirport < this.flattenRadiusInner) {
            height = this.baseAltitude;
        } else if (distToAirport < this.flattenRadiusOuter) {
            // Smoothly blend between airport height and natural height
            // t goes from 0 at Inner to 1 at Outer
            const t = (distToAirport - this.flattenRadiusInner) / (this.flattenRadiusOuter - this.flattenRadiusInner);

            // Smoothstep curve
            const smoothT = t * t * (3 - 2 * t);

            height = MathUtils.lerp(this.baseAltitude, height, smoothT);
        }

        return height;
    }
}
