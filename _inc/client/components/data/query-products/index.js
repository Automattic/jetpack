/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { isDevMode } from 'state/connection';
import { fetchProducts, isFetchingProducts } from 'state/site';

class QueryProducts extends Component {
	static propTypes = {
		isFetchingProducts: PropTypes.bool,
		isDevMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingSiteBenefitsData: false,
	};

	componentDidMount() {
		if ( ! this.props.isDevMode && ! this.props.isFetchingSiteBenefits ) {
			this.props.fetchProducts();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isDevMode: isDevMode( state ),
		isFetchingProducts: isFetchingProducts( state ),
	} ),
	dispatch => ( {
		fetchProducts: () => dispatch( fetchProducts() ),
	} )
)( QueryProducts );
