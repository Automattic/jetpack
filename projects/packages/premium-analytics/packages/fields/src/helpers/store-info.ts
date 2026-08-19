type StoreInfo = {
	/**
	 * ISO 8601 date string of when the store was launched, if known.
	 */
	launchedDate?: string;
};

/**
 * Local stand-in for `getStoreInfo`. Only `launchedDate` is consumed here, where
 * it feeds `getDefaultPreset( launchedDate )` — that helper falls back to its
 * default preset when `launchedDate` is undefined.
 *
 * TODO: Source store info from the analytics boot/localized settings once the
 * host exposes it.
 */
export function getStoreInfo(): StoreInfo {
	return {};
}
