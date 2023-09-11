import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';
import { fetchRecommendationsUpsell, isFetchingRecommendationsUpsell } from 'state/recommendations';

class QueryRecommendationsUpsell extends Component {
	static propTypes = {
		isFetchingRecommendationsUpsell: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingRecommendationsUpsell: false,
		isOfflineMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingRecommendationsUpsell && ! this.props.isOfflineMode ) {
			this.props.fetchRecommendationsUpsell();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingRecommendationsUpsell: isFetchingRecommendationsUpsell( state ),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchRecommendationsUpsell: () => dispatch( fetchRecommendationsUpsell() ),
		};
	}
)( QueryRecommendationsUpsell );
