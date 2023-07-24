import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { dateI18n, isInTheFuture } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
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
		const { expiryDate, purchaseDate, isRefundable, dateFormat, isGift, purchaseID } = this.props;

		// Return null if we don't have any dates.
		if ( ! expiryDate && ! purchaseDate ) {
			return null;
		}

		if ( isGift ) {
			const giftedDateObj = new Date( purchaseDate );
			if ( giftedDateObj.toString() !== 'Invalid Date' ) {
				return sprintf(
					/* translators: placeholder is a date. */
					__( 'Gifted on %s.', 'jetpack' ),
					dateI18n( dateFormat, giftedDateObj )
				);
			}

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
		const path = purchaseID;

		// Return null if date is not parsable.
		if ( expiryDateObj.toString() === 'Invalid Date' ) {
			return null;
		}

		// If the expiry date is in the past, show the expiration date.
		if ( ! isInTheFuture( expiryDateObj ) ) {
			return createInterpolateElement(
				sprintf(
					/* translators: %d is a count of how many new (unread) recommendations are available. */
					__( '<span>Expired on %s.</span> <renewLink />', 'jetpack' ),
					dateI18n( dateFormat, expiryDateObj )
				),
				{
					span: <span className="my-plan-card__expired" />,
					renewLink: (
						<span className={ 'my-plan-card__renew' }>
							<ExternalLink
								href={ getRedirectUrl( 'jetpack-subscription-renew', { path } ) }
								className="my-plan-card__renew"
							>
								{ __( 'Renew subscription', 'jetpack' ) }
							</ExternalLink>
						</span>
					),
				}
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
