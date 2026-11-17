import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import {
	PRODUCT_SLUGS,
	QUERY_GET_VIDEOPRESS_DATA_KEY,
	REST_API_GET_VIDEOPRESS_DATA,
} from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import formatNumber from '../../../utils/format-number';
import ProductOverviewItem from '../overview-item/product-item';
import type { ProductCardComponent } from '../types';

const VideoPressOverviewItem: ProductCardComponent = ( { admin } ) => {
	const { detail } = useProduct( PRODUCT_SLUGS.VIDEOPRESS );
	const { data, isLoading, isFetching, isError, refetch } = useSimpleQuery< VideopressData >( {
		name: QUERY_GET_VIDEOPRESS_DATA_KEY,
		query: { path: REST_API_GET_VIDEOPRESS_DATA },
	} );
	const { videoCount = 0, featuredStats } = data || {};
	const isPluginActive =
		detail?.status === PRODUCT_STATUSES.ACTIVE || detail?.status === PRODUCT_STATUSES.CAN_UPGRADE;
	const loadTracks = useMemo(
		() => ( { stats_period: featuredStats?.period, video_count: videoCount } ),
		[ featuredStats, videoCount ]
	);

	// The card's value: the existing videos while VideoPress is off, otherwise their views.
	let label: string | undefined;
	let value: string | undefined;
	const views = featuredStats?.data?.views?.current;
	const watchTime = featuredStats?.data?.watch_time?.current;
	if ( videoCount && ! isPluginActive ) {
		label = __( 'Existing videos', 'jetpack-my-jetpack' );
		value = String( videoCount );
	} else if ( videoCount && views !== undefined && watchTime !== undefined ) {
		label =
			featuredStats?.period === 'day'
				? __( '30-Day views', 'jetpack-my-jetpack' )
				: __( 'Yearly views', 'jetpack-my-jetpack' );
		value = formatNumber( views );
	}

	return (
		<ProductOverviewItem
			slug={ PRODUCT_SLUGS.VIDEOPRESS }
			admin={ admin }
			actionLabel={ __( 'Upload to VideoPress', 'jetpack-my-jetpack' ) }
			label={ label }
			value={ value }
			isLoading={ isLoading || ( isError && isFetching ) }
			error={
				isError
					? { reason: __( 'Failed to load videos', 'jetpack-my-jetpack' ), onRetry: refetch }
					: undefined
			}
			loadTracks={ loadTracks }
		/>
	);
};

export default VideoPressOverviewItem;
