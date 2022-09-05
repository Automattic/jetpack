/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import numberFormat from '../number-format';
import Text from '../text';
import styles from './style.module.scss';
import { StatCardProps } from './types';
import type React from 'react';

/**
 * StatCard component
 *
 * @param {StatCardProps} props - Component props.
 * @returns {React.ReactNode} - StatCard react component.
 */
const StatCard = ( { className, icon, label, value, variant = 'square' }: StatCardProps ) => {
	const valueTextVariant = variant === 'square' ? 'headline-small' : 'title-medium-semi-bold';
	const formattedValue = numberFormat( value );

	return (
		<div className={ classnames( className, styles.wrapper, styles[ variant ] ) }>
			<div className={ classnames( styles.icon ) }>{ icon }</div>
			<div className={ classnames( styles.info ) }>
				<Text className={ styles.label }>{ label }</Text>
				<Text variant={ valueTextVariant }>{ formattedValue }</Text>
			</div>
		</div>
	);
};

export default StatCard;
