/**
 * External dependencies
 */
import { Tooltip } from '@wordpress/components';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import numberFormat from '../number-format/index.ts';
import Text from '../text/index.tsx';
import styles from './style.module.scss';
import { StatCardProps } from './types.ts';
import type React from 'react';

/**
 * StatCard component
 *
 * @param {StatCardProps} props - Component props.
 * @return {React.ReactNode} - StatCard react component.
 */
const StatCard = ( {
	className,
	hideValue,
	icon,
	label,
	value,
	variant = 'square',
}: StatCardProps ) => {
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
					<Tooltip text={ formattedValue } placement="top">
						<Text variant="headline-small" className={ clsx( styles.value ) }>
							{ hideValue ? '-' : compactValue }
						</Text>
					</Tooltip>
				) : (
					<Text variant="title-medium-semi-bold" className={ clsx( styles.value ) }>
						{ hideValue ? '-' : formattedValue }
					</Text>
				) }
			</div>
		</div>
	);
};

export default StatCard;
