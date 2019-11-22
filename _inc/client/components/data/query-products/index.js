/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchProducts, isFetchingProducts } from 'state/products';

class QueryProducts extends Component {
	static propTypes = {
		isFetchingProducts: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingProducts: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingProducts ) {
			this.props.fetchProducts();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isFetchingProducts: isFetchingProducts( state ),
	} ),
	dispatch => ( {
		fetchProducts: () => dispatch( fetchProducts() ),
	} )
)( QueryProducts );
