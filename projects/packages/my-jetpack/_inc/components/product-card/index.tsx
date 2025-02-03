import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import useConnectSite from '../../hooks/use-connect-site';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import ActionButton from '../action-button';
import SecondaryButton from '../action-button/secondary-button';
import Card from '../card';
import PriceComponent from './pricing-component';
import RecommendationActions from './recommendation-actions';
import Status from './status';
import styles from './style.module.scss';
import type { AdditionalAction, SecondaryAction } from '../action-button/types';
import type { FC, MouseEventHandler, ReactNode, MouseEvent } from 'react';

export type ProductCardProps = {
	children?: ReactNode;
	name: string;
	Description: FC;
	admin: boolean;
	recommendation?: boolean;
	isDataLoading?: boolean;
	isManageDisabled?: boolean;
	slug: JetpackModule;
	additionalActions?: AdditionalAction[];
	upgradeInInterstitial?: boolean;
	primaryActionOverride?: Record< string, AdditionalAction >;
	secondaryAction?: SecondaryAction;
	onActivateStandalone?: () => void;
	status: ProductStatus;
	onMouseEnter?: MouseEventHandler< HTMLButtonElement >;
	onMouseLeave?: MouseEventHandler< HTMLButtonElement >;
	customLoadTracks?: Record< Lowercase< string >, unknown >;
	manageUrl?: string;
};

// ProductCard component
const ProductCard: FC< ProductCardProps > = props => {
	const {
		name,
		Description,
		status,
		isDataLoading,
		slug,
		additionalActions,
		primaryActionOverride,
		children,
		onMouseEnter,
		onMouseLeave,
		recommendation,
		customLoadTracks,
		manageUrl,
	} = props;

	let { secondaryAction } = props;

	const { ownedProducts } = getMyJetpackWindowInitialState( 'lifecycleStats' );
	const isOwned = ownedProducts?.includes( slug );

	const isError =
		status === PRODUCT_STATUSES.EXPIRED || status === PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR;
	const isWarning =
		status === PRODUCT_STATUSES.EXPIRING_SOON ||
		status === PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING;
	const isAbsent =
		status === PRODUCT_STATUSES.ABSENT || status === PRODUCT_STATUSES.ABSENT_WITH_PLAN;
	const isPurchaseRequired = status === PRODUCT_STATUSES.NEEDS_PLAN;

	const containerClassName = clsx( {
		[ styles.plugin_absent ]: isAbsent,
		[ styles[ 'is-purchase-required' ] ]: isPurchaseRequired,
		[ styles[ 'is-link' ] ]: isAbsent,
		[ styles[ 'has-error' ] ]: isError,
		[ styles[ 'has-warning' ] ]: isWarning,
	} );

	const [ isActionLoading, setIsActionLoading ] = useState( false );
	const { recordEvent } = useAnalytics();
	const { siteIsRegistering, isUserConnected } = useMyJetpackConnection();
	const { connectSite } = useConnectSite( {
		tracksInfo: {
			event: `jetpack_myjetpack_product_card_fix_site_connection`,
			properties: {},
		},
	} );
	const isLoading =
		isActionLoading || ( siteIsRegistering && status === PRODUCT_STATUSES.SITE_CONNECTION_ERROR );

	const manageHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	if (
		! secondaryAction &&
		status === PRODUCT_STATUSES.CAN_UPGRADE &&
		! ( slug === 'protect' && ! isUserConnected )
	) {
		secondaryAction = {
			href: manageUrl,
			label: __( 'View', 'jetpack-my-jetpack' ),
			onClick: manageHandler,
		};
	}

	/**
	 * Calls the passed function onFixSiteConnection after firing Tracks event
	 */
	const fixSiteConnectionHandler = useCallback(
		( { e }: { e: MouseEvent< HTMLButtonElement > } ) => {
			connectSite( e );
		},
		[ connectSite ]
	);

	/**
	 * Sends an event when the card loads
	 */
	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_card_load', {
			product: slug,
			status: status,
			...customLoadTracks,
		} );
	}, [ recordEvent, slug, status, customLoadTracks ] );

	return (
		<Card
			title={ name }
			className={ clsx( styles.container, containerClassName ) }
			headerRightContent={ null }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
		>
			{ recommendation && <PriceComponent slug={ slug } /> }
			<Description />

			{ isDataLoading ? (
				<span className={ styles.loading }>{ __( 'Loading…', 'jetpack-my-jetpack' ) }</span>
			) : (
				children
			) }

			{ recommendation ? (
				<RecommendationActions slug={ slug } />
			) : (
				<div className={ styles.actions }>
					<div className={ styles.buttons }>
						{ secondaryAction && secondaryAction?.positionFirst && (
							<SecondaryButton { ...secondaryAction } />
						) }
						<ActionButton
							slug={ slug }
							additionalActions={ additionalActions }
							primaryActionOverride={ primaryActionOverride }
							fixSiteConnectionHandler={ fixSiteConnectionHandler }
							setIsActionLoading={ setIsActionLoading }
							tracksIdentifier="product_card"
						/>
						{ secondaryAction && ! secondaryAction?.positionFirst && (
							<SecondaryButton { ...secondaryAction } />
						) }
					</div>
					<Status
						status={ status }
						isFetching={ isLoading }
						isInstallingStandalone={ false }
						isOwned={ isOwned }
						suppressNeedsAttention={ slug === 'protect' }
					/>
				</div>
			) }
		</Card>
	);
};

export { PRODUCT_STATUSES };
export default ProductCard;
