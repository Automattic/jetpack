/** @jsx h */

/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
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
		const { results = [], query, total = 0, corrected_query = false, loading = false } = this.props;
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
		const num = new Intl.NumberFormat().format( total );
		const style = loading ? { opacity: 0.2 } : { opacity: 1 };

		return (
			<div className="jetpack-instant-search__search-results" style={ style }>
				<p className="jetpack-instant-search__search-results-real-query">
					{ corrected_query !== false
						? sprintf(
								_n( 'Showing %s result for "%s"', 'Showing %s results for "%s"', total ),
								num,
								corrected_query
						  )
						: sprintf( _n( '%s results for "%s"', '%s results for "%s"', total ), num, query ) }
				</p>
				{ corrected_query !== false && (
					<p className="jetpack-instant-search__search-results-unused-query">
						{ sprintf( __( 'No results for "%s"' ), query ) }
					</p>
				) }
				{ results.map( result => this.render_result( result ) ) }
			</div>
		);
	}
}

export default SearchResults;
