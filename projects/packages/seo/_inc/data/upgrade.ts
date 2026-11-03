const UPGRADE_PENDING_KEY = 'jetpack-seo-upgrade-pending';

/** Refresh plan eligibility when returning from a card's checkout link. */
export function markUpgradePending() {
	window.sessionStorage.setItem( UPGRADE_PENDING_KEY, '1' );
}

/**
 * Clear the attempt so ordinary focus events cannot trigger repeated reloads.
 *
 * @return Whether an upgrade attempt was pending.
 */
export function consumePendingUpgrade(): boolean {
	if ( ! window.sessionStorage.getItem( UPGRADE_PENDING_KEY ) ) {
		return false;
	}
	window.sessionStorage.removeItem( UPGRADE_PENDING_KEY );
	return true;
}
