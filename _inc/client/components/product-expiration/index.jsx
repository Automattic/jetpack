/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { moment, translate as __ } from 'i18n-calypso';

class ProductExpiration extends React.PureComponent {
	static propTypes = {
		expiryDate: PropTypes.string.isRequired,
		purchaseDate: PropTypes.string,
		isRefundable: PropTypes.bool,
		dateFormat: PropTypes.string,
	};

	static defaultProps = {
		purchaseDate: '',
		isRefundable: false,
		dateFormat: 'LL',
	};

	render() {
		const { expiryDate, purchaseDate, isRefundable, dateFormat } = this.props;

		// Return nothing if we don't have any dates.
		if ( ! expiryDate && ! purchaseDate ) {
			return null;
		}

		// Return the subscription date if we don't have the expiry date or the plan is refundable.
		if ( ! expiryDate || isRefundable ) {
			return __( 'Purchased on %s.', { args: moment( purchaseDate ).format( dateFormat ) } );
		}

		const expiry = moment( expiryDate );

		// If the expiry date is in the past, show the expiration date.
		if ( expiry.diff( new Date() ) < 0 ) {
			return __( 'Expired on %s.', { args: expiry.format( dateFormat ) } );
		}

		// Lastly, return the renewal date.
		return __( 'Renews on %s.', { args: expiry.format( dateFormat ) } );
	}
}

export default ProductExpiration;
