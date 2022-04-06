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

	const priceObject = getCurrencyObject( value, currency );

	return (
		<Text className={ classNames } variant="headline-medium" component="p">
			<Text component="sup" variant="title-medium">
				{ priceObject.symbol }
			</Text>
			{ priceObject.integer }
			<Text component="sup" variant="title-medium">
				{ priceObject.fraction }
			</Text>
		</Text>
	);
}
/**
 * React component to render the price.
 *
 * @param {object} props                  - Component props.
 * @param {string} props.price            - Product price.
 * @param {string} props.currency         - Product current code.
 * @param {boolean} props.showNotOffPrice - Show the not off price.
 * @returns {object}                        Price react component.
 */
export default function ProductPrice( { price, currency, showNotOffPrice } ) {
	if ( ! price || ! currency ) {
		return null;
	}

	return (
		<div className={ styles[ 'price-container' ] }>
			<Price value={ price } currency={ currency } isOff={ showNotOffPrice } />
		</div>
	);
}

ProductPrice.propTypes = {
	currency: PropTypes.string,
	price: PropTypes.string,
	showNotOffPrice: PropTypes.bool,
};

ProductPrice.defaultProps = {
	currency: '',
	price: '',
	showNotOffPrice: false,
};
