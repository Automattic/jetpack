import { dateI18n, isInTheFuture } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';

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
		dateFormat: 'F j, Y',
	};

	render() {
		const { expiryDate, purchaseDate, isRefundable, dateFormat } = this.props;

		// Return null if we don't have any dates.
		if ( ! expiryDate && ! purchaseDate ) {
			return null;
		}

		// Return the subscription date if we don't have the expiry date or the plan is refundable.
		if ( ! expiryDate || isRefundable ) {
			const purchaseDateObj = new Date( purchaseDate );
			if ( purchaseDateObj.toString() !== 'Invalid Date' ) {
				return sprintf(
					/* translators: placeholder is a date. */
					__( 'Purchased on %s.', 'jetpack' ),
					dateI18n( dateFormat, purchaseDateObj )
				);
			}

			return null;
		}

		const expiryDateObj = new Date( expiryDate );

		// Return null if date is not parsable.
		if ( expiryDateObj.toString() === 'Invalid Date' ) {
			return null;
		}

		// If the expiry date is in the past, show the expiration date.
		if ( ! isInTheFuture( expiryDateObj ) ) {
			return sprintf(
				/* translators: placeholder is a date. */
				__( 'Expired on %s.', 'jetpack' ),
				dateI18n( dateFormat, expiryDateObj )
			);
		}

		// Lastly, return the renewal date.
		return sprintf(
			/* translators: placeholder is a date. */
			__( 'Renews on %s.', 'jetpack' ),
			dateI18n( dateFormat, expiryDateObj )
		);
	}
}

export default ProductExpiration;
