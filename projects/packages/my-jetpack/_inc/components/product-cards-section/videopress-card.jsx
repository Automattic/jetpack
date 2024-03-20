/**
 * External dependencies
 */
import { numberFormat } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import {
	REST_API_VIDEOPRESS_FEATURED_STATS,
	QUERY_VIDEOPRESS_STATS_KEY,
} from '../../data/constants';
import useSimpleQuery from '../../data/use-simple-query';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
/**
 * Internal dependencies
 */
import ProductCard from '../connected-product-card';
import { SingleContextualInfo, ChangePercentageContext } from './contextual-card-info';

const useVideoPressStats = () => {
	const {
		data: stats,
		isLoading,
		isError,
	} = useSimpleQuery( {
		name: QUERY_VIDEOPRESS_STATS_KEY,
		query: { path: REST_API_VIDEOPRESS_FEATURED_STATS },
	} );

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
		isLoading,
		isError,
		currentFormatted,
		change,
		changePercentage,
	};
};

const VideopressCard = ( { admin } ) => {
	const { videoPressStats = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
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
