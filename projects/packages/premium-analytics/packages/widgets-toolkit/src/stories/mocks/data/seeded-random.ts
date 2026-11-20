/**
 * A seeded pseudo-random generator, so a story draws the same data on every render.
 *
 * @param seed - Seed value for reproducible randomness.
 * @return Function that generates random numbers (0-1).
 */
export function seededRandom( seed: number ): () => number {
	let state = seed;
	return () => {
		state = ( state * 9301 + 49297 ) % 233280;
		return state / 233280;
	};
}
