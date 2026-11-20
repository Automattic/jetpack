import { scaleBand } from '@visx/scale';

export type BandScale = ( ( value: unknown ) => number | undefined ) & { bandwidth: () => number };

/**
 * Match the inner slot scale used by visx BarGroup.
 * @param keys      - Visible primary series keys.
 * @param bandwidth - Category band width.
 * @param padding   - Padding between slots.
 * @return The grouped bar scale.
 */
export const createGroupScale = ( keys: string[], bandwidth: number, padding: number ) =>
	scaleBand( { domain: keys, range: [ 0, bandwidth ], padding } );
