/**
 * External dependencies
 */
import { Text, numberFormat, LoadingPlaceholder } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { arrowUp, arrowDown, Icon } from '@wordpress/icons';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';

export const ChangePercentageContext = ( { change, changePercentage } ) => {
	if ( ! Number.isFinite( change ) ) {
		return null;
	}

	const changeIcon = change > 0 ? arrowUp : arrowDown;
	const changeFormatted = numberFormat( Math.abs( change ), {
		notation: 'compact',
		compactDisplay: 'short',
	} );

	return (
		<div
			className={ clsx( styles[ 'contextual-percentage-change' ], {
				[ styles.neutral ]: change === 0,
				[ styles.positive ]: change > 0,
				[ styles.negative ]: change < 0,
			} ) }
		>
			{ !! change && (
				<Icon icon={ changeIcon } size={ 14 } className={ styles[ 'change-icon' ] } />
			) }
			<Text className={ styles[ 'change-values' ] }>
				{ sprintf(
					/* translators: both placeholders are numbers */
					__( '%1$s (%2$s%%)', 'jetpack-my-jetpack' ),
					changeFormatted,
					changePercentage
				) }
			</Text>
		</div>
	);
};

ChangePercentageContext.propTypes = {
	change: PropTypes.number,
	changePercentage: PropTypes.number,
};

export const SingleContextualInfo = ( { description, value, context, loading } ) => {
	if ( loading ) {
		return (
			<div className={ styles[ 'single-contextual-info-placeholder' ] }>
				<LoadingPlaceholder height={ 24 } />
				<LoadingPlaceholder height={ 36 } />
			</div>
		);
	}

	return (
		<>
			<Text>{ description }</Text>
			<div className={ styles[ 'single-contextual-info' ] }>
				<Text className={ styles[ 'main-value' ] }>{ value }</Text>
				{ context }
			</div>
		</>
	);
};

SingleContextualInfo.propTypes = {
	description: PropTypes.string.isRequired,
	value: PropTypes.string,
	context: PropTypes.node,
	loading: PropTypes.bool,
};
