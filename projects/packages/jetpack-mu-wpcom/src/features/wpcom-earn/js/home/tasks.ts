import type { LaunchpadTask } from '../data/launchpad.ts';

/**
 * Correct the tasks the server cannot judge, and point Calypso paths at WordPress.com.
 *
 * @param tasks             - The checklist's tasks.
 * @param facts             - What the page knows about the site.
 * @param facts.isConnected - Whether Stripe is connected.
 * @param facts.hasProducts - Whether the site offers anything to pay for.
 * @return The tasks.
 */
export function filterEarnTasks(
	tasks: LaunchpadTask[],
	{ isConnected, hasProducts }: { isConnected: boolean; hasProducts: boolean }
): LaunchpadTask[] {
	return tasks.map( task => {
		const corrected = { ...task };

		// The server cannot see either fact on Atomic.
		if ( task.id === 'stripe_connected' ) {
			corrected.completed = isConnected;
		} else if ( task.id === 'paid_offer_created' ) {
			corrected.completed = hasProducts;
		}

		if ( corrected.calypso_path?.startsWith( '/' ) ) {
			corrected.calypso_path = `https://wordpress.com${ corrected.calypso_path }`;
		}

		return corrected;
	} );
}
