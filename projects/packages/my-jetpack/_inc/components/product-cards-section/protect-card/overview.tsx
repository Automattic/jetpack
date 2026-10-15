import { formatNumberCompact } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';
import {
	PRODUCT_SLUGS,
	QUERY_GET_PROTECT_DATA_KEY,
	REST_API_GET_PROTECT_DATA,
} from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';
import OverviewCard from '../overview-card';
import type { ProductCardComponent } from '../types';

const ProtectOverviewCard: ProductCardComponent = ( { admin } ) => {
	const { detail, isLoading: isLoadingProduct } = useProduct( PRODUCT_SLUGS.PROTECT );
	const { isPluginActive = false, hasPaidPlanForProduct = false, manageUrl } = detail || {};
	const { isSiteConnected } = useMyJetpackConnection();
	const {
		data,
		isLoading: isLoadingProtectData,
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
	if ( hasPaidPlanForProduct ) {
		label = __( 'Threats found', 'jetpack-my-jetpack' );
		count = isPluginActive && isSiteConnected ? ( data?.scanData?.num_threats ?? 0 ) : undefined;
	} else {
		label = __( 'Blocked login attempts', 'jetpack-my-jetpack' );
		const canBlockLogins =
			( isPluginActive || isJetpackPluginActive() ) &&
			isSiteConnected &&
			data?.wafConfig?.brute_force_protection;
		count = canBlockLogins ? ( data?.wafConfig?.blocked_logins ?? 0 ) : undefined;
	}

	const hasFailed = isError && error?.code !== 'not_connected';

	return (
		<OverviewCard
			slug={ PRODUCT_SLUGS.PROTECT }
			admin={ admin }
			label={ label }
			value={ count !== undefined ? formatNumberCompact( count ) : undefined }
			badge={
				count === undefined
					? { label: __( 'Off', 'jetpack-my-jetpack' ), intent: 'none' }
					: undefined
			}
			action={
				hasPaidPlanForProduct && manageUrl
					? {
							label: count
								? __( 'Fix threats', 'jetpack-my-jetpack' )
								: __( 'Manage Protect', 'jetpack-my-jetpack' ),
							href: manageUrl,
						}
					: undefined
			}
			upgrade={
				hasPaidPlanForProduct
					? undefined
					: { label: __( 'Scan threats', 'jetpack-my-jetpack' ), href: '#/add-protect' }
			}
			isLoading={ isLoadingProduct || isLoadingProtectData }
			error={
				hasFailed
					? {
							reason: hasPaidPlanForProduct
								? __( 'Failed to load threats', 'jetpack-my-jetpack' )
								: __( 'Failed to load blocked logins', 'jetpack-my-jetpack' ),
							onRetry: refetch,
						}
					: undefined
			}
		/>
	);
};

export default ProtectOverviewCard;
