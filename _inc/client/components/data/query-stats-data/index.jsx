/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { isFetchingStatsData, fetchStatsData } from 'state/at-a-glance';

class QueryStatsData extends Component {
	componentWillMount() {
		if ( ! this.props.fetchingStatsData ) {
			this.props.fetchStatsData();
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
		fetchStatsData: fetchStatsData(),
		fetchingStatsData: isFetchingStatsData( state )
	};
}, ( dispatch ) => {
	return bindActionCreators( {
		fetchStatsData
	}, dispatch );
}
)( QueryStatsData );
