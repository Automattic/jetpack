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
		switch ( this.props.result_format ) {
			case 'minimal':
			default:
				return <SearchResultMinimal result={ result } />;
		}
	}

	render() {
		const { results = [], query } = this.props;
		return (
			<div className="jetpack-instant-search__search-results">
				<p>{ sprintf( __( 'You are searching for: "%s"' ), query ) }</p>
				{ results.map( result => this.render_result( result ) ) }
			</div>
		);
	}
}

export default SearchResults;
