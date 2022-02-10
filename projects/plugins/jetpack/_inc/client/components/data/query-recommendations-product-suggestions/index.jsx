/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	fetchRecommendationsProductSuggestions,
	isFetchingRecommendationsProductSuggestions,
} from 'state/recommendations';
import { isOfflineMode } from 'state/connection';

class QueryRecommendationsProductSuggestions extends Component {
	static propTypes = {
		isFetchingRecommendationsProductSuggestions: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingRecommendationsProductSuggestions: false,
		isOfflineMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingRecommendationsProductSuggestions && ! this.props.isOfflineMode ) {
			this.props.fetchRecommendationsProductSuggestions();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingRecommendationsProductSuggestions: isFetchingRecommendationsProductSuggestions(
				state
			),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchRecommendationsProductSuggestions: () =>
				dispatch( fetchRecommendationsProductSuggestions() ),
		};
	}
)( QueryRecommendationsProductSuggestions );
