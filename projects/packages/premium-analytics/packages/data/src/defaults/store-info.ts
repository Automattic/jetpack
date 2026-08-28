export type StoreInfo = {
	/**
	 * ISO 8601 date string of when the store was launched, if known.
	 */
	launchedDate?: string;
};

/**
 * Stand-in for real store info. `launchedDate` is the only field consumed, and
 * it feeds `getDefaultPreset( launchedDate )`, which falls back to its default
 * preset when the date is undefined — so an empty object stays correct.
 *
 * TODO: Source store info from the analytics boot/localized settings once the
 * host exposes it.
 */
export function getStoreInfo(): StoreInfo {
	return {};
}
