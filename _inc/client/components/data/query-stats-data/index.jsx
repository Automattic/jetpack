/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { isFetchingStatsData, fetchStatsData } from 'state/at-a-glance';

class QueryStatsData extends Component {
	componentWillMount() {
		if ( ! this.props.fetchingStatsData ) {
			this.props.fetchStatsData( this.props.range );
		}
	}

	render() {
		return null;
	}
}

QueryStatsData.defaultProps = {
	fetchStatsData: () => {}
};

export default connect( ( state ) => {
	return {
		fetchStatsData: ( range ) => fetchStatsData( state, range ),
		fetchingStatsData: isFetchingStatsData( state )
	};
}, ( dispatch ) => {
	return {
		fetchStatsData: ( range ) => {
			return dispatch( fetchStatsData( range ) );
		}
	};
}
)( QueryStatsData );