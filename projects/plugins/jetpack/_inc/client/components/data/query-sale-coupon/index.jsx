/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchSaleCoupon, isFetchingSaleCoupon } from 'state/sale-coupon';

class QuerySaleCoupon extends Component {
	static defaultProps = {
		isFetchingSaleCoupon: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingSaleCoupon ) {
			this.props.fetchSaleCoupon();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isFetchingSaleCoupon: isFetchingSaleCoupon( state ),
	} ),
	dispatch => ( {
		fetchSaleCoupon: () => dispatch( fetchSaleCoupon() ),
	} )
)( QuerySaleCoupon );
