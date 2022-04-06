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
 * React component to render the price.
 *
 * @param {object} props                  - Component props.
 * @param {string} props.price            - Product price.
 * @param {string} props.currency         - Product current code.
 * @param {boolean} props.showNotOffPrice - Show the not off price.
 * @returns {object}                        Price react component.
 */
export default function Price( { price, currency, showNotOffPrice } ) {
	if ( ! price || ! currency ) {
		return null;
	}

	const priceObject = getCurrencyObject( price, currency );

	const classNames = classnames( styles.price, {
		[ styles[ 'is-off-price' ] ]: showNotOffPrice,
	} );

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

Price.propTypes = {
	currency: PropTypes.string,
	price: PropTypes.string,
	offPrice: PropTypes.string,
	showNotOffPrice: PropTypes.bool,
};

Price.defaultProps = {
	currency: '',
	price: '',
	offPrice: '',
	showNotOffPrice: false,
};
