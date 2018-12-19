/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getSearchTerm } from 'state/search';

export class Tracker extends Component {
	componentWillReceiveProps( nextProps ) {
		const record = this.props.analytics.tracks.recordEvent;

		if ( nextProps.searchTerm !== this.props.searchTerm ) {
			record( 'jetpack_wpa_search_term', { term: nextProps.searchTerm } );
		}
	}

	render() {
		return null;
	}
}

Tracker.propTypes = {
	analytics: PropTypes.object,
	searchTerm: PropTypes.string,
};

export default connect( state => {
	return {
		searchTerm: getSearchTerm( state ),
	};
} )( Tracker );
