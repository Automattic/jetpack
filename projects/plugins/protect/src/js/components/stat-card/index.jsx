/**
 * External dependencies
 */
import { Text, numberFormat } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import React from 'react';
import styles from './styles.module.scss';

const StatCard = ( {
	className,
	icon,
	label,
	period,
	value,
	variant = 'square',
	disabled = false,
} ) => {
	const formattedValue = numberFormat( value );
	const compactValue = numberFormat( value, {
		notation: 'compact',
		compactDisplay: 'short',
	} );

	return (
		<div
			className={ classnames(
				className,
				styles.wrapper,
				styles[ variant ],
				disabled ? styles.disabled : ''
			) }
		>
			<div className={ classnames( styles.icon ) }>
				{ icon }
				{ disabled && 'square' === variant && (
					<Text variant={ 'label' }>{ __( 'Paid feature', 'jetpack-protect' ) }</Text>
				) }
			</div>
			<div className={ classnames( styles.info ) }>
				{ variant === 'square' ? (
					<>
						<Text className={ styles.label } varant={ 'body-small' }>
							{ label }
						</Text>
						<Text className={ styles.label } varant={ 'body-small' }>
							{ period }
						</Text>
						<Text variant={ 'headline-small' } className={ classnames( styles.value ) }>
							{ compactValue }
						</Text>
					</>
				) : (
					<>
						<Text
							className={ styles.label }
							varant={ 'body-small' }
						>{ `${ label } ${ period.toLowerCase() }` }</Text>
						<Text variant={ 'title-medium-semi-bold' } className={ classnames( styles.value ) }>
							{ formattedValue }
						</Text>
					</>
				) }
			</div>
		</div>
	);
};

export default StatCard;
