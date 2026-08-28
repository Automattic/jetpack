export type StoreInfo = {
	/**
	 * ISO 8601 date string of when the store was launched, if known.
	 */
	launchedDate?: string;
};

/**
 * Stand-in for real store info; every consumer tolerates the empty object.
 *
 * TODO: Source store info from the analytics boot/localized settings once the
 * host exposes it.
 */
export function getStoreInfo(): StoreInfo {
	return {};
}
