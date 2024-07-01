/**
 * External dependencies
 */
import { Tooltip } from '@wordpress/components';
import clsx from 'clsx';
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
	const formattedValue = numberFormat( value );
	const compactValue = numberFormat( value, {
		notation: 'compact',
		compactDisplay: 'short',
	} );

	return (
		<div className={ clsx( className, styles.wrapper, styles[ variant ] ) }>
			<div className={ clsx( styles.icon ) }>{ icon }</div>
			<div className={ clsx( styles.info ) }>
				<Text className={ styles.label }>{ label }</Text>
				{ variant === 'square' ? (
					// @todo Switch to `placement` once WordPress 6.4 is the minimum.
					<Tooltip text={ formattedValue } position="top center">
						<Text variant="headline-small" className={ clsx( styles.value ) }>
							{ compactValue }
						</Text>
					</Tooltip>
				) : (
					<Text variant="title-medium-semi-bold" className={ clsx( styles.value ) }>
						{ formattedValue }
					</Text>
				) }
			</div>
		</div>
	);
};

export default StatCard;
