/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchRecommendationsUpsell, isFetchingRecommendationsUpsell } from 'state/recommendations';
import { isOfflineMode } from 'state/connection';

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
