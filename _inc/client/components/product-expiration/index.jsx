/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { moment, translate as __, localize } from 'i18n-calypso';

class ProductExpiration extends React.PureComponent {
	static propTypes = {
		expiry_date: PropTypes.string,
		subscribed_date: PropTypes.string,
		is_refundable: PropTypes.bool,
	};

	static defaultProps = {
		expiry_date: '',
		subscribed_date: '',
		is_refundable: false,
	};

	render() {
		const { expiry_date, subscribed_date, is_refundable } = this.props;

		// Return nothing if we don't have any dates.
		if ( ! expiry_date && ! subscribed_date ) {
			return null;
		}

		// Return the subscription date if we don't have the expiry date or the plan is refundable.
		if ( ! expiry_date || is_refundable ) {
			return __( 'Purchased on %s.', { args: moment( subscribed_date ).format( 'LL' ) } );
		}

		const expiry = moment( expiry_date );

		// If the expiry date is in the past, show the expiration date.
		if ( expiry.diff( new Date() ) < 0 ) {
			return __( 'Expired on %s.', { args: expiry.format( 'LL' ) } );
		}

		// Lastly, return the renewal date.
		return __( 'Renews on %s.', { args: expiry.format( 'LL' ) } );
	}
}

export default localize( ProductExpiration );
