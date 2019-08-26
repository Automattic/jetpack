/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchSiteBenefits, isFetchingSiteBenefits } from 'state/site';
import { isDevMode } from 'state/connection';

class QuerySiteBenefits extends Component {
	static defaultProps = {
		isFetchingSiteBenefitsData: false,
		isDevMode: false,
	};

	UNSAFE_componentWillMount() {
		if ( ! this.props.isFetchingSiteBenefits && ! this.props.isDevMode ) {
			this.props.fetchSiteBenefits();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingSiteBenefits: isFetchingSiteBenefits( state ),
			isDevMode: isDevMode( state ),
		};
	},
	dispatch => {
		return {
			fetchSiteBenefits: () => dispatch( fetchSiteBenefits() ),
		};
	}
)( QuerySiteBenefits );
