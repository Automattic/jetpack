/**
 * External dependencies
 */
import { Text } from '@wordpress/ui';
import { useEffect, useRef } from 'react';
/**
 * Internal dependencies
 */
import { PRODUCT_STATUSES } from '../../constants';
import useProduct from '../../data/products/use-product';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import preventWidows from '../../utils/prevent-widows';
import ProductCard from '../product-card';
import type { AdditionalAction, SecondaryAction } from '../action-button/types';
import type { FC, ReactNode } from 'react';

interface ConnectedProductCardProps {
	admin: boolean;
	recommendation?: boolean;
	showMenu?: boolean;
	slug: JetpackModule;
	children?: ReactNode;
	isDataLoading?: boolean;
	Description?: FC;
	additionalActions?: AdditionalAction[];
	secondaryAction?: SecondaryAction;
	upgradeInInterstitial?: boolean;
	primaryActionOverride?: Record< string, AdditionalAction >;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	customLoadTracks?: Record< Lowercase< string >, unknown >;
	variant?: 'default' | 'slim';
}

const CONNECTION_STATUSES: string[] = [
	PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION,
	PRODUCT_STATUSES.SITE_CONNECTION_ERROR,
];

const ConnectedProductCard: FC< ConnectedProductCardProps > = ( {
	admin,
	recommendation,
	slug,
	children,
	isDataLoading,
	Description = null,
	additionalActions = null,
	secondaryAction = null,
	upgradeInInterstitial = false,
	primaryActionOverride,
	onMouseEnter,
	onMouseLeave,
	customLoadTracks,
	variant = 'default',
} ) => {
	const { isRegistered } = useMyJetpackConnection();
	const { detail, refetch } = useProduct( slug );
	const { name, description: defaultDescription, status, manageUrl } = detail;

	const DefaultDescription = () => {
		// Replace the last space with a non-breaking space to prevent widows
		const cardDescription = preventWidows( defaultDescription );

		return (
			<Text variant="body-sm" style={ { flexGrow: 1, marginBottom: '1rem' } }>
				{ cardDescription }
			</Text>
		);
	};

	// Refetch only when the site connects after load, or a card mounts with a status that predates
	// the connection; on load the products query already agrees with the connection.
	const wasRegistered = useRef( isRegistered );
	const awaitsConnection = CONNECTION_STATUSES.includes( status );
	useEffect( () => {
		if ( isRegistered && ( ! wasRegistered.current || awaitsConnection ) ) {
			refetch();
		}
		wasRegistered.current = isRegistered;
	}, [ isRegistered, awaitsConnection, refetch ] );

	return (
		<ProductCard
			name={ name }
			Description={ Description ? Description : DefaultDescription }
			status={ status }
			admin={ admin }
			recommendation={ recommendation }
			isDataLoading={ isDataLoading }
			additionalActions={ additionalActions }
			primaryActionOverride={ primaryActionOverride }
			secondaryAction={ secondaryAction }
			slug={ slug }
			upgradeInInterstitial={ upgradeInInterstitial }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			customLoadTracks={ customLoadTracks }
			manageUrl={ manageUrl }
			variant={ variant }
		>
			{ children }
		</ProductCard>
	);
};

export default ConnectedProductCard;
