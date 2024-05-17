import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchSiteProducts, isFetchingSiteProducts, getSiteProducts } from 'state/site-products';

class QuerySiteProducts extends Component {
	static propTypes = {
		isFetchingSiteProducts: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingSiteProducts: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingSiteProducts && isEmpty( this.props.siteProducts ) ) {
			this.props.fetchSiteProducts();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isFetchingSiteProducts: isFetchingSiteProducts( state ),
		products: getSiteProducts( state ),
	} ),
	dispatch => ( {
		fetchSiteProducts: () => dispatch( fetchSiteProducts() ),
	} )
)( QuerySiteProducts );
