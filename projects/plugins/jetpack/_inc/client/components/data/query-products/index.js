import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchProducts, isFetchingProducts, getProducts } from 'state/products';

class QueryProducts extends Component {
	static propTypes = {
		isFetchingProducts: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingProducts: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingProducts && isEmpty( this.props.products ) ) {
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
		products: getProducts( state ),
	} ),
	dispatch => ( {
		fetchProducts: () => dispatch( fetchProducts() ),
	} )
)( QueryProducts );
