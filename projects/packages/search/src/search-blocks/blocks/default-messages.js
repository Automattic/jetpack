import { __ } from '@wordpress/i18n';

/**
 * Default empty-state copy, keyed by whether filters are active.
 *
 * Editor-side mirror of `Search_Blocks::no_results_default_messages()` — the
 * `no-results` block previews it and `results-list` uses it as inspector
 * placeholder text, so a single source keeps the two from drifting into
 * near-identical translator strings that disagree.
 *
 * A function, not a constant, so the `__()` calls run after the editor's i18n
 * is loaded rather than being cached in the source locale at module init.
 *
 * @return {{unfiltered: string, filtered: string}} Default messages.
 */
export const noResultsDefaultMessages = () => ( {
	unfiltered: __( 'No results found. Try a different search.', 'jetpack-search-pkg' ),
	filtered: __(
		'No results match these filters. Try clearing some, or searching for something else.',
		'jetpack-search-pkg'
	),
} );
