import formatCurrency from '@automattic/format-currency';
import { Button, getProductCheckoutUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { FC, MouseEventHandler, ReactNode, useCallback, useEffect } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import Card from '../card';
import ActionButton from './action-button';
import SecondaryButton, { SecondaryButtonProps } from './secondary-button';
import Status from './status';
import styles from './style.module.scss';

export const PRODUCT_STATUSES_LABELS = {
	[ PRODUCT_STATUSES.ACTIVE ]: __( 'Active', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.INACTIVE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.MODULE_DISABLED ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ABSENT ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ABSENT_WITH_PLAN ]: __( 'Needs Plugin', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.USER_CONNECTION_ERROR ]: __( 'Needs user account', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.SITE_CONNECTION_ERROR ]: __( 'Needs connection', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.CAN_UPGRADE ]: __( 'Active', 'jetpack-my-jetpack' ),
};

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
	onActivate?: MouseEventHandler< HTMLButtonElement >;
	slug: string;
	additionalActions?: unknown[];
	upgradeInInterstitial?: boolean;
	primaryActionOverride?: Record< string, { href?: string; label?: string } >;
	secondaryAction?: Record< string, SecondaryButtonProps & { positionFirst?: boolean } >;
	onInstallStandalone?: MouseEventHandler< HTMLButtonElement >;
	onActivateStandalone?: MouseEventHandler< HTMLButtonElement >;
	status: ( typeof PRODUCT_STATUSES )[ keyof typeof PRODUCT_STATUSES ];
	onMouseEnter?: MouseEventHandler< HTMLButtonElement >;
	onMouseLeave?: MouseEventHandler< HTMLButtonElement >;
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
	} = props;

	const isError =
		status === PRODUCT_STATUSES.SITE_CONNECTION_ERROR ||
		status === PRODUCT_STATUSES.USER_CONNECTION_ERROR;
	const isAbsent =
		status === PRODUCT_STATUSES.ABSENT || status === PRODUCT_STATUSES.ABSENT_WITH_PLAN;
	const isPurchaseRequired =
		status === PRODUCT_STATUSES.NEEDS_PURCHASE ||
		status === PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE;

	const containerClassName = clsx( {
		[ styles.plugin_absent ]: isAbsent,
		[ styles[ 'is-purchase-required' ] ]: isPurchaseRequired,
		[ styles[ 'is-link' ] ]: isAbsent,
		[ styles[ 'has-error' ] ]: isError,
	} );

	const { recordEvent } = useAnalytics();

	/**
	 * Calls the passed function onActivate after firing Tracks event
	 */
	const activateHandler = useCallback(
		event => {
			event.preventDefault();
			recordEvent( 'jetpack_myjetpack_product_card_activate_click', {
				product: slug,
			} );
			onActivate( event );
		},
		[ slug, onActivate, recordEvent ]
	);

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
	 * Calls the passed function onManage after firing Tracks event
	 */
	const fixConnectionHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_fixconnection_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

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
	const installStandaloneHandler = useCallback(
		event => {
			event.preventDefault();
			recordEvent( 'jetpack_myjetpack_product_card_install_standalone_plugin_click', {
				product: slug,
			} );
			onInstallStandalone( event );
		},
		[ slug, onInstallStandalone, recordEvent ]
	);

	/**
	 * Sends an event when the card loads
	 */
	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_card_loaded', {
			product: slug,
			status: status,
		} );
	}, [ recordEvent, slug, status ] );

	return (
		<Card
			title={ name }
			className={ clsx( styles.container, containerClassName ) }
			headerRightContent={ null }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
		>
			{ recommendation && <Price slug={ slug } /> }
			<Description />

			{ isDataLoading ? (
				<span className={ styles.loading }>{ __( 'Loading…', 'jetpack-my-jetpack' ) }</span>
			) : (
				children
			) }

			{ recommendation && <RecommendationActions slug={ slug } /> }
			{ ! recommendation && (
				<div className={ styles.actions }>
					<div className={ styles.buttons }>
						{ secondaryAction && secondaryAction?.positionFirst && (
							<SecondaryButton { ...secondaryAction } />
						) }
						<ActionButton
							{ ...ownProps }
							onActivate={ activateHandler }
							onFixConnection={ fixConnectionHandler }
							onManage={ manageHandler }
							onAdd={ addHandler }
							onInstall={ installStandaloneHandler }
							onLearnMore={ learnMoreHandler }
							className={ styles.button }
							additionalActions={ additionalActions }
							primaryActionOverride={ primaryActionOverride }
						/>
						{ secondaryAction && ! secondaryAction?.positionFirst && (
							<SecondaryButton { ...secondaryAction } />
						) }
					</div>
					<Status
						status={ status }
						isFetching={ isFetching }
						isInstallingStandalone={ isInstallingStandalone }
					/>
				</div>
			) }
		</Card>
	);
};

const usePricing = ( slug: string ) => {
	const { detail } = useProduct( slug );

	if ( detail.tiers.length === 0 ) {
		const {
			pricingForUi: { discountPricePerMonth, fullPricePerMonth, currencyCode },
		} = detail;
		return { discountPrice: discountPricePerMonth, fullPrice: fullPricePerMonth, currencyCode };
	}

	if ( detail.tiers.includes( 'upgraded' ) ) {
		const { discountPrice, fullPrice, currencyCode } = detail.pricingForUi.tiers.upgraded;
		const hasDiscount = discountPrice && discountPrice !== fullPrice;
		return {
			discountPrice: hasDiscount ? discountPrice / 12 : null,
			fullPrice: fullPrice / 12,
			currencyCode,
		};
	}

	return { discountPrice: 0, fullPrice: 0, currencyCode: '' };
};

const Price = ( { slug }: { slug: string } ) => {
	const { discountPrice, fullPrice, currencyCode } = usePricing( slug );

	return (
		<div className={ styles.priceContainer }>
			{ discountPrice && (
				<span className={ clsx( styles.price ) }>
					{ formatCurrency( discountPrice, currencyCode ) }
				</span>
			) }
			<span className={ clsx( styles.price, discountPrice && styles.discounted ) }>
				{ formatCurrency( fullPrice, currencyCode ) }
			</span>
			<span className={ styles.term }>/month, billed yearly</span>
		</div>
	);
};

const RecommendationActions = ( { slug }: { slug: string } ) => {
	const { detail } = useProduct( slug );
	const { isUserConnected } = useMyJetpackConnection();
	const { adminUrl, siteSuffix } = getMyJetpackWindowInitialState();
	const purchaseUrl = getProductCheckoutUrl(
		detail.wpcomProductSlug,
		siteSuffix,
		`${ adminUrl }?page=my-jetpack`,
		isUserConnected
	);
	const learnMoreUrl = `#/add-${ slug }`;
	return (
		<div className={ styles.actions }>
			<div className={ clsx( styles.buttons, styles.recommendation ) }>
				<Button size="small" href={ purchaseUrl }>
					{ __( 'Purchase', 'jetpack-my-jetpack' ) }
				</Button>
				<Button
					className={ styles.recommendationLink }
					size="small"
					variant="link"
					href={ learnMoreUrl }
				>
					{ __( 'Learn more', 'jetpack-my-jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

export { PRODUCT_STATUSES };
export default ProductCard;
