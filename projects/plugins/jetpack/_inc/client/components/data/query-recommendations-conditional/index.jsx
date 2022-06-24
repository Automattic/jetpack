import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';
import {
	fetchRecommendationsConditional,
	isFetchingRecommendationsConditional,
} from 'state/recommendations';

class QueryRecommendationsConditional extends Component {
	static propTypes = {
		isFetchingRecommendationsConditional: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingRecommendationsConditional: false,
		isOfflineMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingRecommendationsConditional && ! this.props.isOfflineMode ) {
			this.props.fetchRecommendationsConditional();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingRecommendationsConditional: isFetchingRecommendationsConditional( state ),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchRecommendationsConditional: () => dispatch( fetchRecommendationsConditional() ),
		};
	}
)( QueryRecommendationsConditional );
