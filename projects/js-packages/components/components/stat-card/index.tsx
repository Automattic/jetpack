/**
 * External dependencies
 */
import { Tooltip } from '@wordpress/components';
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
	const formattedValue = numberFormat( value );
	const compactValue = numberFormat( value, {
		notation: 'compact',
		compactDisplay: 'short',
	} );

	return (
		<div className={ classnames( className, styles.wrapper, styles[ variant ] ) }>
			<div className={ classnames( styles.icon ) }>{ icon }</div>
			<div className={ classnames( styles.info ) }>
				<Text className={ styles.label }>{ label }</Text>
				{ variant === 'square' ? (
					<Tooltip text={ formattedValue } position="top center">
						<Text variant="headline-small" className={ classnames( styles.value ) }>
							{ compactValue }
						</Text>
					</Tooltip>
				) : (
					<Text variant="title-medium-semi-bold" className={ classnames( styles.value ) }>
						{ formattedValue }
					</Text>
				) }
			</div>
		</div>
	);
};

export default StatCard;
