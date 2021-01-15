/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';

/**
 * Internal dependencies
 */
import { getPreselectedFilters } from '../lib/query-string';
import SearchFilters from './search-filters';

const PreselectedSearchFilters = props => {
	const preselectedFilters = getPreselectedFilters( props.widgets, props.widgetsOutsideOverlay );

	return (
		<div className="jetpack-instant-search__testing">
			{ preselectedFilters.length > 0 && (
				<SearchFilters
					loading={ props.isLoading }
					locale={ props.locale }
					postTypes={ props.postTypes }
					results={ props.results }
					widget={ { filters: preselectedFilters } }
				/>
			) }
		</div>
	);
};
export default PreselectedSearchFilters;
