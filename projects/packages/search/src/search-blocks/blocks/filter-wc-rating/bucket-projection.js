/**
 * Bucket → cumulative "& up" projection for the rating filter.
 *
 * Lives in its own module so the runtime view (view.js) and the test
 * suite share the same implementation — there's no parallel JS-side
 * truth source for this projection. The PHP-side mirror is in
 * render.php's foreach over `$seeded_buckets`.
 *
 * Returned shape uses string keys ("1".."5") because the consumer
 * (`ratingOptionCount` getter in view.js) reads `starValue` from the
 * `data-wp-context` attribute, which arrives as a string. Keeping
 * the map keyed as strings throughout avoids relying on JS object
 * keys' implicit number-to-string coercion.
 */

/**
 * Project a histogram bucket array onto a cumulative "& up" star → count
 * map. Each star N's count is the sum of doc_counts for every bucket
 * whose key is ≥ N - 0.5 — i.e. every avg_rating that rounds to N or
 * higher under WC's `ROUND(avg, 0)` rule. Guarantees the rendered
 * counts are monotone (count(3) ≥ count(4) ≥ count(5)) — the property
 * shoppers expect from threshold rows. Buckets below 0.5 (the implicit
 * "no rating" bucket the histogram emits at -0.5 thanks to
 * `min_doc_count: 0`) are ignored.
 *
 * @param {Array<{key: number, doc_count: number}>} buckets - Aggregation buckets.
 * @return {Object<string, number>} Star (as string key, "1".."5") → count.
 */
export function bucketsToStarCountMap( buckets ) {
	const map = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	if ( ! Array.isArray( buckets ) ) {
		return map;
	}
	for ( const bucket of buckets ) {
		const key = Number( bucket?.key ?? NaN );
		const count = Number( bucket?.doc_count ?? 0 );
		if ( ! Number.isFinite( key ) || key < 0.5 ) {
			continue;
		}
		// Bucket keys land on .5 boundaries; `key + 0.5` is the highest
		// star whose threshold this bucket clears. A doc in the 4.5
		// bucket counts toward 5★+, 4★+, …, 1★+; a doc in the 0.5
		// bucket only toward 1★+. `Math.round` shrugs off FP slop.
		const cap = Math.min( 5, Math.round( key + 0.5 ) );
		for ( let star = 1; star <= cap; star++ ) {
			map[ String( star ) ] += count;
		}
	}
	return map;
}
