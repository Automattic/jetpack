import { getCurrencyObject } from '@automattic/format-currency';
import classnames from 'classnames';
import Text from '../text';
import styles from './style.module.scss';
import type { PriceProps } from './types';
import type React from 'react';

/**
 * React component to render a Price composition.
 *
 * @param {PriceProps} props  - Component props.
 * @returns {React.ReactNode} -Price react component.
 */
export const Price: React.FC< PriceProps > = ( { value, currency, isOff } ) => {
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
};
