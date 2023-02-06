import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';
import { fetchRecommendationsData, isFetchingRecommendationsData } from 'state/recommendations';

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
