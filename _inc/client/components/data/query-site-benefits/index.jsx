/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { fetchSiteBenefits, isFetchingSiteBenefits } from 'state/site';
// import { isDevMode } from 'state/connection';

class QuerySiteBenefits extends React.Component {
	static propTypes = {
		isFetchingSiteBenefits: PropTypes.bool,
	};

	UNSAFE_componentWillMount() {
		if ( ! this.props.isFetchingSiteBenefits ) {
			this.props.fetchSiteBenefits();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isFetchingSiteBenefits: isFetchingSiteBenefits( state ),
	} ),
	{
		fetchSiteBenefits,
	}
)( QuerySiteBenefits );
