/** @jsx h */

/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import SearchResultMinimal from './search-result-minimal';

class SearchResults extends Component {
	render_result( result ) {
		switch ( this.props.resultFormat ) {
			case 'engagement':
			case 'product':
			case 'minimal':
			default:
				return <SearchResultMinimal result={ result } />;
		}
	}

	render() {
		const { results = [], query, total = 0, corrected_query = false } = this.props;
		if ( query === '' ) {
			return <div className="jetpack-instant-search__search-results" />;
		}
		if ( total === 0 ) {
			return (
				<div className="jetpack-instant-search__search-results">
					<div>
						<h3>{ sprintf( __( 'No Results.' ), query ) }</h3>
					</div>
				</div>
			);
		}

		return (
			<div className="jetpack-instant-search__search-results">
				<p className="jetpack-instant-search__search-results-real-query">
					{ corrected_query !== false
						? sprintf( __( 'Showing results for "%s"' ), corrected_query )
						: sprintf( __( 'Results for "%s"' ), query ) }
				</p>
				{ corrected_query !== false && (
					<p className="jetpack-instant-search__search-results-unused-query">
						{ sprintf( __( 'No results for "%s"' ), query ) }
					</p>
				) }
				<span className="jetpack-instant-search__search-results-count">
					{ sprintf( __( '%d Results' ), total ) }
				</span>
				{ results.map( result => this.render_result( result ) ) }
			</div>
		);
	}
}

export default SearchResults;
