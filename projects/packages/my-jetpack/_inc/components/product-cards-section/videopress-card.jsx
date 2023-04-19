/**
 * External dependencies
 */
import { numberFormat } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import ProductCard from '../connected-product-card';
import { SingleContextualInfo, ChangePercentageContext } from './contextual-card-info';

const useVideoPressStats = () => {
	const stats = useSelect( select => select( STORE_ID ).getProductStats( 'videopress' ) );

	const loading = stats === undefined;
	const hasError = stats === null;
	const views = stats?.data?.views ?? {};
	const { previous = null, current = null } = views;
	const currentFormatted =
		current !== null
			? numberFormat( current, { notation: 'compact', compactDisplay: 'short' } )
			: null;
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

const VideopressCard = ( { admin } ) => {
	const { loading, hasError, change, currentFormatted, changePercentage } = useVideoPressStats();

	if ( hasError ) {
		return <ProductCard admin={ admin } slug="videopress" showMenu />;
	}

	const description = __( 'Views, last 7 days', 'jetpack-my-jetpack' );

	return (
		<ProductCard admin={ admin } slug="videopress" showMenu={ true }>
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
