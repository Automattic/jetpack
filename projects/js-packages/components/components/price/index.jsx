/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getCurrencyObject } from '@automattic/format-currency';

/**
 * Internal dependencies
 */
import Text from '../text/index.jsx';
import styles from './style.module.scss';

/**
 * React component to render a Price composition.
 *
 * @param {object} props          - Component props.
 * @param {string} props.value    - Price valuerice.
 * @param {string} props.currency - Price current code.
 * @param {string} props.isOff    - True when it is an off- price.
 * @returns {React.Component}       Price react component.
 */
export function Price( { value, currency, isOff } ) {
	const classNames = classnames( styles.price, {
		[ styles[ 'is-off-price' ] ]: isOff,
	} );

	const { symbol, integer, fraction } = getCurrencyObject( value, currency );

	return (
		<Text className={ classNames } variant="headline-medium" component="p">
			<Text component="sup" variant="title-medium">
				{ symbol }
			</Text>
			{ integer }
			<Text component="sup" variant="title-medium">
				{ fraction }
			</Text>
		</Text>
	);
}
/**
 * React component to render the price.
 *
 * @param {object} props                  - Component props.
 * @param {string} props.price            - Product price.
 * @param {string} props.offPrice         - Product with discount.
 * @param {string} props.currency         - Product current code.
 * @param {boolean} props.showNotOffPrice - Show the not off price.
 * @returns {object}                        Price react component.
 */
export default function ProductPrice( { price, offPrice, currency, showNotOffPrice } ) {
	if ( ! price || ! currency ) {
		return null;
	}

	// Show off-price only when off Price is defined.
	showNotOffPrice = showNotOffPrice && Boolean( offPrice );

	return (
		<div className={ styles[ 'price-container' ] }>
			{ showNotOffPrice && <Price value={ price } currency={ currency } isOff={ true } /> }
			<Price value={ offPrice || price } currency={ currency } />
		</div>
	);
}

ProductPrice.propTypes = {
	currency: PropTypes.string,
	price: PropTypes.string,
	offPrice: PropTypes.string,
	showNotOffPrice: PropTypes.bool,
};

ProductPrice.defaultProps = {
	currency: '',
	price: '',
	offPrice: '',
	showNotOffPrice: true,
};
