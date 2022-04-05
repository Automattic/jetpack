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
 * @param {object} props          - Component props.
 * @param {string} props.value    - Product price
 * @param {string} props.currency - Product current code
 * @param {string} props.isOld    - True when the product price is old
 * @returns {object}                Price react component.
 */
export default function Price( { value, currency, isOld } ) {
	if ( ! value || ! currency ) {
		return null;
	}

	const priceObject = getCurrencyObject( value, currency );

	const classNames = classnames( styles.price, {
		[ styles[ 'is-old' ] ]: isOld,
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
	value: PropTypes.string,
	currency: PropTypes.string,
	isOld: PropTypes.bool,
};

Price.defaultProps = {
	value: '',
	currency: '',
	isOld: false,
};
