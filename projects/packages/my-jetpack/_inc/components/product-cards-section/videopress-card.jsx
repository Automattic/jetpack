/**
 * External dependencies
 */
import { numberFormat } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
/**
 * Internal dependencies
 */
import { useProduct } from '../../hooks/use-product';
import ProductCard from '../connected-product-card';
import { SingleContextualInfo, ChangePercentageContext } from './contextual-card-info';

const useVideoPressStats = () => {
	const { stats } = useProduct( 'videopress' );

	const loading = stats === undefined;
	const hasError = stats === null;
	const views = stats?.data?.views ?? {};
	const { previous = null, current = null } = views;
	const currentFormatted =
		current !== null
			? numberFormat( current, { notation: 'compact', compactDisplay: 'short' } )
			: null;
	const change = current !== null && previous !== null ? current - previous : null;
	let changePercentage = null;

	if ( change !== null ) {
		if ( change === 0 ) {
			changePercentage = 0;
		} else if ( previous === 0 ) {
			changePercentage = 100;
		} else {
			changePercentage = Math.round( ( change / previous ) * 100 );
		}
	}

	return {
		loading,
		hasError,
		currentFormatted,
		change,
		changePercentage,
	};
};

const VideopressCard = ( { admin } ) => {
	const { videoPressStats = false } = window.myJetpackInitialState?.myJetpackFlags ?? {};
	const { loading, hasError, change, currentFormatted, changePercentage } = useVideoPressStats();

	if ( ! videoPressStats || hasError ) {
		return <ProductCard admin={ admin } slug="videopress" showMenu />;
	}

	const description = __( 'Views, last 7 days', 'jetpack-my-jetpack' );

	return (
		<ProductCard admin={ admin } slug="videopress" showMenu>
			<SingleContextualInfo
				loading={ loading }
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
