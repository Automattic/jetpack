/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchRecommendationsData, isFetchingRecommendationsData } from 'state/recommendations';
import { isOfflineMode } from 'state/connection';

class QueryRecommendationsData extends Component {
	static propTypes = {
		isFetchingRecommendationsData: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingRecommendationsData: false,
		isOfflineMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingRecommendationsData && ! this.props.isOfflineMode ) {
			this.props.fetchRecommendationsData();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingRecommendationsData: isFetchingRecommendationsData( state ),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchRecommendationsData: () => dispatch( fetchRecommendationsData() ),
		};
	}
)( QueryRecommendationsData );
