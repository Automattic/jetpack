/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getSearchTerm } from 'state/search';

export const Tracker = React.createClass( {
	componentWillReceiveProps( nextProps ) {
		const record = this.props.analytics.tracks.recordEvent;

		if ( nextProps.searchTerm !== this.props.searchTerm ) {
			record( 'jetpack_wpa_search_term', { term: nextProps.searchTerm } );
		}
	},

	render() {
		return null;
	}
} );

Tracker.propTypes = {
	analytics: React.PropTypes.object,
	searchTerm: React.PropTypes.string
};

export default connect(
	( state ) => {
		return {
			searchTerm: getSearchTerm( state )
		};
	}
)( Tracker );
