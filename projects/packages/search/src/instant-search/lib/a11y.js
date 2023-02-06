/**
 * Check if the user has specified that they prefer reduced motion
 *
 * @see https://www.joshwcomeau.com/react/prefers-reduced-motion/
 * @returns {boolean} Prefers reduced motion?
 */
export function getPrefersReducedMotion() {
	const query = '(prefers-reduced-motion: no-preference)';
	const mediaQueryList = window.matchMedia( query );
	const prefersReducedMotion = ! mediaQueryList.matches;

	return prefersReducedMotion;
}
