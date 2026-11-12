import { formatNumberCompact } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';
import { generatePath } from 'react-router';
import { MyJetpackRoutes } from '../../../constants';
import {
	PRODUCT_SLUGS,
	QUERY_GET_PROTECT_DATA_KEY,
	REST_API_GET_PROTECT_DATA,
} from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';
import OverviewItem, { isHealthyStatus } from '../overview-item';
import useOverviewLoadEvent from '../overview-item/use-overview-load-event';
import useStatusAction from '../overview-item/use-status-action';
import type { OverviewItemLink } from '../overview-item';
import type { ProductCardComponent } from '../types';

const ProtectOverviewItem: ProductCardComponent = ( { admin } ) => {
	const { detail, isLoading: isLoadingProduct } = useProduct( PRODUCT_SLUGS.PROTECT );
	const { status, isPluginActive = false, hasPaidPlanForProduct = false, manageUrl } = detail || {};
	const { recordEvent } = useAnalytics();
	const { action: statusAction, forcedOffReason } = useStatusAction(
		PRODUCT_SLUGS.PROTECT,
		__( 'Activate Protect', 'jetpack-my-jetpack' ),
		null
	);
	const { isSiteConnected } = useMyJetpackConnection();
	const {
		data,
		isLoading: isLoadingProtectData,
		isFetching,
		isError,
		error,
		refetch,
	} = useSimpleQuery< ProtectData >( {
		name: QUERY_GET_PROTECT_DATA_KEY,
		query: {
			path: REST_API_GET_PROTECT_DATA,
		},
	} );

	// Show a count only while Protect is running on a connected site; otherwise it is off.
	let label: string;
	let count: number | undefined;
	let action: OverviewItemLink | undefined;
	let upgrade: OverviewItemLink | undefined;
	let failureReason: string;
	if ( hasPaidPlanForProduct ) {
		label = __( 'Threats found', 'jetpack-my-jetpack' );
		count = isPluginActive && isSiteConnected ? ( data?.scanData?.num_threats ?? 0 ) : undefined;
		if ( manageUrl ) {
			action = {
				label: count
					? __( 'Fix threats', 'jetpack-my-jetpack' )
					: __( 'Manage Protect', 'jetpack-my-jetpack' ),
				href: manageUrl,
				onClick: () =>
					recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
						product: PRODUCT_SLUGS.PROTECT,
					} ),
			};
		}
		failureReason = __( 'Failed to load threats', 'jetpack-my-jetpack' );
	} else {
		label = __( 'Blocked login attempts', 'jetpack-my-jetpack' );
		const canBlockLogins =
			( isPluginActive || isJetpackPluginActive() ) &&
			isSiteConnected &&
			data?.wafConfig?.brute_force_protection;
		count = canBlockLogins ? ( data?.wafConfig?.blocked_logins ?? 0 ) : undefined;
		upgrade = {
			label: __( 'Scan threats', 'jetpack-my-jetpack' ),
			href: `#${ generatePath( MyJetpackRoutes.AddProtect ) }`,
			onClick: () =>
				recordEvent( 'jetpack_myjetpack_product_card_add_click', {
					product: PRODUCT_SLUGS.PROTECT,
				} ),
		};
		failureReason = __( 'Failed to load blocked logins', 'jetpack-my-jetpack' );
	}

	// A disconnected site answers "not_connected": Protect is off there, not failing.
	const hasFailed = isError && error?.code !== 'not_connected';
	const isRetrying = isError && isFetching;
	const isLoading = isLoadingProduct || isLoadingProtectData || isRetrying;
	useOverviewLoadEvent( PRODUCT_SLUGS.PROTECT, isLoading );

	return (
		<OverviewItem
			slug={ PRODUCT_SLUGS.PROTECT }
			admin={ admin }
			label={ label }
			value={ count !== undefined ? formatNumberCompact( count ) : undefined }
			badge={
				count === undefined
					? { label: __( 'Off', 'jetpack-my-jetpack' ), intent: 'none' }
					: undefined
			}
			action={ isHealthyStatus( PRODUCT_SLUGS.PROTECT, status ) ? action : statusAction }
			upgrade={ upgrade }
			isLoading={ isLoading }
			error={ hasFailed ? { reason: failureReason, onRetry: refetch } : undefined }
			forcedOffReason={ forcedOffReason }
		/>
	);
};

export default ProtectOverviewItem;
