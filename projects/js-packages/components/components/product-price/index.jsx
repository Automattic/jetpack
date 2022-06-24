import { getCurrencyObject } from '@automattic/format-currency';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Text from '../text/index';
import styles from './style.module.scss';

/**
 * React component to render a Price composition.
 *
 * @param {object} props          - Component props.
 * @param {number} props.value    - Price valuerice.
 * @param {number} props.currency - Price current code.
 * @param {string} props.isOff    - True when it is an off- price.
 * @returns {React.Component}       Price react component.
 */
export function Price( { value, currency, isOff } ) {
	const classNames = classnames( styles.price, {
		[ styles[ 'is-not-off-price' ] ]: ! isOff,
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
 * @param {string} props.leyend           - Product leytend.
 * @param {boolean} props.showNotOffPrice - Show the not off price.
 * @param {boolean} props.isNotConvenientPrice   - Force the price as a not off price.
 * @returns {object}                        Price react component.
 */
export default function ProductPrice( {
	price,
	offPrice,
	currency,
	showNotOffPrice,
	leyend,
	isNotConvenientPrice,
} ) {
	if ( ! ( price || offPrice ) || ! currency ) {
		return null;
	}

	showNotOffPrice = showNotOffPrice && Boolean( offPrice );

	return (
		<>
			<div className={ styles.container }>
				{ showNotOffPrice && <Price value={ price } currency={ currency } isOff={ false } /> }
				<Price value={ offPrice || price } currency={ currency } isOff={ ! isNotConvenientPrice } />
			</div>
			{ leyend && <Text className={ styles.leyend }>{ leyend }</Text> }
		</>
	);
}

ProductPrice.propTypes = {
	currency: PropTypes.string,
	price: PropTypes.number,
	offPrice: PropTypes.number,
	isNotConvenientPrice: PropTypes.bool,
	leyend: PropTypes.string,
	showNotOffPrice: PropTypes.bool,
};

ProductPrice.defaultProps = {
	currency: '',
	isNotConvenientPrice: false,
	leyend: __( '/month, paid yearly', 'jetpack' ),
	showNotOffPrice: true,
};
