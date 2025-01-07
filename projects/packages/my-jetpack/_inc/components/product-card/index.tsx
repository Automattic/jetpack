import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import useConnectSite from '../../hooks/use-connect-site';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import Card from '../card';
import ActionButton from './action-button';
import PriceComponent from './pricing-component';
import RecommendationActions from './recommendation-actions';
import SecondaryButton from './secondary-button';
import Status from './status';
import styles from './style.module.scss';
import type { AdditionalAction, SecondaryAction } from './types';
import type { MutateCallback } from '../../data/use-simple-mutation';
import type { FC, MouseEvent, MouseEventHandler, ReactNode } from 'react';

export type ProductCardProps = {
	children?: ReactNode;
	name: string;
	Description: FC;
	admin: boolean;
	recommendation?: boolean;
	isFetching?: boolean;
	isDataLoading?: boolean;
	isInstallingStandalone?: boolean;
	isManageDisabled?: boolean;
	onActivate?: () => void;
	slug: JetpackModule;
	additionalActions?: AdditionalAction[];
	upgradeInInterstitial?: boolean;
	primaryActionOverride?: Record< string, AdditionalAction >;
	secondaryAction?: SecondaryAction;
	onInstallStandalone?: MutateCallback;
	onActivateStandalone?: () => void;
	status: ProductStatus;
	onMouseEnter?: MouseEventHandler< HTMLButtonElement >;
	onMouseLeave?: MouseEventHandler< HTMLButtonElement >;
	customLoadTracks?: Record< Lowercase< string >, unknown >;
};

// ProductCard component
const ProductCard: FC< ProductCardProps > = props => {
	const ownProps = {
		isFetching: false,
		isInstallingStandalone: false,
		onActivate: () => {},
		...props,
	};
	const {
		name,
		Description,
		status,
		onActivate,
		isFetching,
		isDataLoading,
		isInstallingStandalone,
		slug,
		additionalActions,
		primaryActionOverride,
		secondaryAction,
		children,
		onInstallStandalone,
		onMouseEnter,
		onMouseLeave,
		recommendation,
		customLoadTracks,
	} = props;

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

	const { recordEvent } = useAnalytics();
	const { siteIsRegistering } = useMyJetpackConnection();
	const isLoading =
		isFetching || ( siteIsRegistering && status === PRODUCT_STATUSES.SITE_CONNECTION_ERROR );
	const { connectSite } = useConnectSite( {
		tracksInfo: {
			event: 'jetpack_myjetpack_product_card_fix_site_connection',
			properties: {},
		},
	} );

	/**
	 * Calls the passed function onActivate after firing Tracks event
	 */
	const activateHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_activate_click', {
			product: slug,
		} );
		onActivate();
	}, [ slug, onActivate, recordEvent ] );

	/**
	 * Calls the passed function onAdd after firing Tracks event
	 */
	const addHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_add_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const manageHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	/**
	 * Calls the passed function onFixConnection after firing Tracks event
	 */
	const fixUserConnectionHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_fixconnection_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

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
	 * Calls when the "Learn more" button is clicked
	 */
	const learnMoreHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_learnmore_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	/**
	 * Use a Tracks event to count a standalone plugin install request
	 */
	const installStandaloneHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_install_standalone_plugin_click', {
			product: slug,
		} );
		onInstallStandalone();
	}, [ slug, onInstallStandalone, recordEvent ] );

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
							{ ...ownProps }
							onActivate={ activateHandler }
							onFixUserConnection={ fixUserConnectionHandler }
							onFixSiteConnection={ fixSiteConnectionHandler }
							onManage={ manageHandler }
							onAdd={ addHandler }
							onInstall={ installStandaloneHandler }
							onLearnMore={ learnMoreHandler }
							className={ styles.button }
							additionalActions={ additionalActions }
							primaryActionOverride={ primaryActionOverride }
							isOwned={ isOwned }
						/>
						{ secondaryAction && ! secondaryAction?.positionFirst && (
							<SecondaryButton { ...secondaryAction } />
						) }
					</div>
					<Status
						status={ status }
						isFetching={ isLoading }
						isInstallingStandalone={ isInstallingStandalone }
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
