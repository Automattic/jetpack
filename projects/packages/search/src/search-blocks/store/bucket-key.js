/**
 * Bucket-key helpers shared by filter-checkbox and active-filters so the two
 * surfaces never disagree on how a bucket is labelled.
 */

/**
 * Slug for an aggregation bucket key.
 *
 * @param {unknown} rawKey - Bucket `key` from the search response.
 * @return {string} Slug.
 */
export function bucketValue( rawKey ) {
	const key = String( rawKey ?? '' );
	const slashIdx = key.indexOf( '/' );
	return slashIdx === -1 ? key : key.slice( 0, slashIdx );
}

/**
 * Display label for a bucket. `valueLabels[slug]` wins (covers post_type
 * buckets whose key is just the slug); else the post-slash portion of a
 * `slug/Name` key; else the slug itself.
 *
 * @param {unknown}                               rawKey      - Bucket `key`.
 * @param {Object<string, string>|null|undefined} valueLabels - Optional slug→label map.
 * @return {string} Display label.
 */
export function bucketLabel( rawKey, valueLabels ) {
	const key = String( rawKey ?? '' );
	const slashIdx = key.indexOf( '/' );
	const value = slashIdx === -1 ? key : key.slice( 0, slashIdx );
	const fromConfig = valueLabels?.[ value ];
	if ( fromConfig ) {
		return fromConfig;
	}
	return slashIdx === -1 ? key : key.slice( slashIdx + 1 );
}
