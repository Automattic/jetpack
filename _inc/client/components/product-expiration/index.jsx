/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { moment, translate as __ } from 'i18n-calypso';

class ProductExpiration extends React.PureComponent {
	static propTypes = {
		expiryDate: PropTypes.string,
		purchaseDate: PropTypes.string,
		isRefundable: PropTypes.bool,
		dateFormat: PropTypes.string,
	};

	static defaultProps = {
		expiryDate: '',
		purchaseDate: '',
		isRefundable: false,
		dateFormat: 'LL',
	};

	render() {
		const { expiryDate, purchaseDate, isRefundable, dateFormat } = this.props;

		// Return null if we don't have any dates.
		if ( ! expiryDate && ! purchaseDate ) {
			return null;
		}

		// Return the subscription date if we don't have the expiry date or the plan is refundable.
		if ( ! expiryDate || isRefundable ) {
			const purchaseMoment = moment( purchaseDate );
			if ( purchaseMoment.isValid() ) {
				return __( 'Purchased on %s.', { args: purchaseMoment.format( dateFormat ) } );
			}
			return null;
		}

		const expiryMoment = moment( expiryDate );

		// Return null if date is not parsable.
		if ( ! expiryMoment.isValid() ) {
			return null;
		}

		// If the expiry date is in the past, show the expiration date.
		if ( expiryMoment.diff( new Date() ) < 0 ) {
			return __( 'Expired on %s.', { args: expiryMoment.format( dateFormat ) } );
		}

		// Lastly, return the renewal date.
		return __( 'Renews on %s.', { args: expiryMoment.format( dateFormat ) } );
	}
}

export default ProductExpiration;
