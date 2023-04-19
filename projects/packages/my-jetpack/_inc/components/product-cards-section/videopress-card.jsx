/**
 * External dependencies
 */
import { Text, numberFormat, LoadingPlaceholder } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { arrowUp, arrowDown, Icon } from '@wordpress/icons';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import ProductCard from '../connected-product-card';
import styles from './style.module.scss';

const formatOptions = { notation: 'compact', compactDisplay: 'short' };

const useVideoPressStats = () => {
	const stats = useSelect( select => select( STORE_ID ).getProductStats( 'videopress' ) );

	const loading = stats === undefined;
	const hasError = stats === null;
	const views = stats?.data?.views ?? {};
	const { previous = null, current = null } = views;
	const currentFormatted = current !== null ? numberFormat( current, formatOptions ) : null;
	const change = current !== null && previous !== null ? current - previous : null;
	const changePercentage = change !== null ? Math.round( ( change / previous ) * 100 ) : null;

	return {
		loading,
		hasError,
		currentFormatted,
		change,
		changePercentage,
	};
};

const ChangePercentageContext = ( { change, changePercentage } ) => {
	if ( ! Number.isFinite( change ) ) {
		return null;
	}

	const changeIcon = change > 0 ? arrowUp : arrowDown;
	const changeFormatted = numberFormat( Math.abs( change ), formatOptions );

	return (
		<div
			className={ classNames( styles[ 'contextual-percentage-change' ], {
				[ styles.positive ]: change > 0,
				[ styles.negative ]: change < 0,
			} ) }
		>
			{ !! change && (
				<Icon icon={ changeIcon } size={ 14 } className={ styles[ 'change-icon' ] } />
			) }
			<Text className={ styles[ 'change-values' ] }>
				{ sprintf(
					/* translators: first placeholder is user name, second is either the (Owner) string or an empty string */
					__( '%1$s (%2$s%%)', 'jetpack-my-jetpack' ),
					changeFormatted,
					changePercentage
				) }
			</Text>
		</div>
	);
};

const SingleContextualInfo = ( { description, value, context } ) => {
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

const VideopressCard = ( { admin } ) => {
	const { loading, hasError, change, currentFormatted, changePercentage } = useVideoPressStats();

	if ( loading ) {
		return (
			<ProductCard admin={ admin } slug="videopress" showMenu>
				<div className={ styles[ 'single-contextual-info-placeholder' ] }>
					<LoadingPlaceholder height={ 24 } />
					<LoadingPlaceholder height={ 36 } />
				</div>
			</ProductCard>
		);
	}

	if ( hasError ) {
		return <ProductCard admin={ admin } slug="videopress" showMenu />;
	}

	const description = __( 'Views, last 7 days', 'jetpack-my-jetpack' );

	return (
		<ProductCard admin={ admin } slug="videopress" showMenu={ true }>
			<SingleContextualInfo
				description={ description }
				value={ currentFormatted }
				context={
					<ChangePercentageContext change={ change } changePercentage={ changePercentage } />
				}
			/>
		</ProductCard>
	);
};

VideopressCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default VideopressCard;
