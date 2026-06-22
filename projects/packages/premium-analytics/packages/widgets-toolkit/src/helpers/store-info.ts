type StoreInfo = {
	/**
	 * ISO 8601 date string of when the store was launched, if known.
	 */
	launchedDate?: string;
};

/**
 * Local stand-in for `getStoreInfo`. Only `launchedDate` is consumed by this
 * package, where it feeds `getDefaultPreset( launchedDate )` — that helper
 * falls back to its default preset when `launchedDate` is undefined, so
 * returning an empty object keeps the behavior correct until real store info
 * is available.
 *
 * TODO: Source store info from the analytics boot/localized settings once the
 * host exposes it.
 */
export function getStoreInfo(): StoreInfo {
	return {};
}
