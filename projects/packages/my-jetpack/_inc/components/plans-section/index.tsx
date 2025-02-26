import { Text, H3, Title, Button } from '@automattic/jetpack-components';
import { getDate, dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback } from 'react';
import { MyJetpackRoutes, PRODUCT_STATUSES } from '../../constants';
import { QUERY_PURCHASES_KEY, REST_API_SITE_PURCHASES_ENDPOINT } from '../../data/constants';
import useProduct from '../../data/products/use-product';
import useSimpleQuery from '../../data/use-simple-query';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import getManageYourPlanUrl from '../../utils/get-manage-your-plan-url';
import getPurchasePlanUrl from '../../utils/get-purchase-plan-url';
import { isLifetimePurchase } from '../../utils/is-lifetime-purchase';
import { GoldenTokenTooltip } from '../golden-token/tooltip';
import styles from './style.module.scss';
import type { MyJetpackInitialState } from '../../data/types';
import type { FC } from 'react';

type Purchase = MyJetpackInitialState[ 'purchases' ][ 'items' ][ 0 ];

interface PlanSectionProps {
	purchase: Purchase;
}

interface PlanSectionHeaderAndFooterProps {
	numberOfPurchases: number;
}

const PlanSection: FC< PlanSectionProps > = ( { purchase } ) => {
	const { product_name } = purchase;
	return (
		<div className={ styles[ 'plan-container' ] }>
			<Title>{ product_name }</Title>
			<PlanExpiry purchase={ purchase } />
		</div>
	);
};

const PlanExpiry: FC< PlanSectionProps > = ( { purchase } ) => {
	const {
		ID,
		expiry_date,
		expiry_status,
		partner_name,
		product_name,
		product_slug,
		subscribed_date,
		domain,
	} = purchase;

	const managePurchaseUrl = `https://wordpress.com/me/purchases/${ domain }/${ ID }`;
	const renewUrl = `https://wordpress.com/checkout/${ product_slug }/renew/${ ID }/${ domain }`;

	const isExpired = PRODUCT_STATUSES.EXPIRED === expiry_status;
	const isExpiringSoon = PRODUCT_STATUSES.EXPIRING_SOON === expiry_status;
	const isExpiringPurchase = isExpired || isExpiringSoon;

	const expiryMessageClassName = clsx( {
		[ styles[ 'is-expired' ] ]: isExpired,
		[ styles[ 'is-expiring-soon' ] ]: isExpiringSoon,
	} );

	const expiryMessage = useCallback( () => {
		const hundredYearDate = getDate( subscribed_date );
		hundredYearDate.setFullYear( hundredYearDate.getFullYear() + 100 );

		// If expiry_date is null, we'll default to 100 years in the future (same behavior in Store Admin).
		const expiryDate = dateI18n( 'F jS, Y', expiry_date ?? hundredYearDate );

		if ( isExpiringPurchase ) {
			// Expiring soon
			if ( isExpiringSoon ) {
				return sprintf(
					// translators: %1$s is the formatted date to display, i.e.- November 24th, 2024
					__( 'Expiring soon on %1$s', 'jetpack-my-jetpack' ),
					expiryDate
				);
			}

			// Expired
			return sprintf(
				// translators: %1$s is the formatted date to display, i.e.- November 24th, 2024
				__( 'Expired on %1$s', 'jetpack-my-jetpack' ),
				expiryDate
			);
		}

		if ( ! expiry_date && partner_name ) {
			// This means the subscription was provisioned by a hosting partner.
			return sprintf(
				// translators: %1$s is the name of the hosting partner. i.e.- Bluehost, InMotion, Pressable, Jurassic Ninja, etc..
				__( 'Managed by: %1$s', 'jetpack-my-jetpack' ),
				partner_name
			);
		}
		return sprintf(
			// translators: %1$s is the formatted date to display, i.e.- November 24th, 2024
			__( 'Expires on %1$s', 'jetpack-my-jetpack' ),
			expiryDate
		);
	}, [ expiry_date, isExpiringPurchase, isExpiringSoon, partner_name, subscribed_date ] );

	const expiryAction = useCallback( () => {
		if ( ! isExpiringPurchase ) {
			return null;
		}

		if ( isExpiringSoon ) {
			return (
				<Button href={ renewUrl } isExternalLink={ true } variant="link" weight="regular">
					{ __( 'Renew subscription', 'jetpack-my-jetpack' ) }
				</Button>
			);
		}

		return (
			<Button href={ managePurchaseUrl } isExternalLink={ true } variant="link" weight="regular">
				{ __( 'Resume subscription', 'jetpack-my-jetpack' ) }
			</Button>
		);
	}, [ isExpiringPurchase, isExpiringSoon, managePurchaseUrl, renewUrl ] );

	if ( isLifetimePurchase( purchase ) ) {
		return (
			<Text variant="body" className={ styles[ 'expire-date' ] }>
				<span className={ styles[ 'expire-date--with-icon' ] }>
					{ __( 'Never Expires', 'jetpack-my-jetpack' ) }
				</span>
				<GoldenTokenTooltip productName={ product_name } giftedDate={ subscribed_date } />
			</Text>
		);
	}

	return (
		<>
			<Text variant="body" className={ clsx( styles[ 'expire-date' ], expiryMessageClassName ) }>
				{ expiryMessage() }
			</Text>
			{ isExpiringPurchase && <Text>{ expiryAction() }</Text> }
		</>
	);
};

const PlanSectionHeader: FC< PlanSectionHeaderAndFooterProps > = ( { numberOfPurchases = 0 } ) => {
	return (
		<>
			<H3>{ _n( 'Your plan', 'Your plans', numberOfPurchases, 'jetpack-my-jetpack' ) }</H3>
			{ numberOfPurchases === 0 && (
				<Text variant="body">{ __( 'Want to power up your Jetpack?', 'jetpack-my-jetpack' ) }</Text>
			) }
		</>
	);
};

const PlanSectionFooter: FC< PlanSectionHeaderAndFooterProps > = ( { numberOfPurchases } ) => {
	const { recordEvent } = useAnalytics();
	const { isUserConnected } = useMyJetpackConnection();
	const { detail: complete } = useProduct( 'complete' );
	const hasComplete = complete.hasPaidPlanForProduct;

	const planManageDescription = _n(
		'Manage your plan',
		'Manage your plans',
		numberOfPurchases,
		'jetpack-my-jetpack'
	);

	const planPurchaseDescription = __( 'Purchase a plan', 'jetpack-my-jetpack' );

	const planManageClickHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_plans_manage_click' );
	}, [ recordEvent ] );

	const planPurchaseClickHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_plans_purchase_click' );
	}, [ recordEvent ] );

	const navigateToConnectionPage = useMyJetpackNavigate( MyJetpackRoutes.ConnectionSkipPricing );
	const activateLicenseClickHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_activate_license_click' );
		if ( ! isUserConnected ) {
			navigateToConnectionPage();
		}
	}, [ navigateToConnectionPage, isUserConnected, recordEvent ] );

	let activateLicenceDescription = __( 'Activate a license', 'jetpack-my-jetpack' );
	if ( ! isUserConnected ) {
		activateLicenceDescription = __(
			'Activate a license (requires a user connection)',
			'jetpack-my-jetpack'
		);
	}

	const { loadAddLicenseScreen = '', adminUrl = '' } = getMyJetpackWindowInitialState();

	return (
		<ul>
			{ numberOfPurchases > 0 && (
				<li className={ styles[ 'actions-list-item' ] }>
					<Button
						onClick={ planManageClickHandler }
						href={ getManageYourPlanUrl() }
						weight="regular"
						variant="link"
						isExternalLink={ true }
					>
						{ planManageDescription }
					</Button>
				</li>
			) }
			{ ! hasComplete && (
				<li className={ styles[ 'actions-list-item' ] }>
					<Button
						onClick={ planPurchaseClickHandler }
						href={ getPurchasePlanUrl() }
						weight="regular"
						variant="link"
						isExternalLink={ true }
					>
						{ planPurchaseDescription }
					</Button>
				</li>
			) }

			{ ! hasComplete && loadAddLicenseScreen && (
				<li className={ styles[ 'actions-list-item' ] }>
					<Button
						onClick={ activateLicenseClickHandler }
						href={
							isUserConnected ? `${ adminUrl }admin.php?page=my-jetpack#/add-license` : undefined
						}
						variant="link"
						weight="regular"
					>
						{ activateLicenceDescription }
					</Button>
				</li>
			) }
		</ul>
	);
};

const PlansSection: FC = () => {
	const userIsAdmin = !! getMyJetpackWindowInitialState( 'userIsAdmin' );
	const { isSiteConnected } = useMyJetpackConnection();
	const response = useSimpleQuery( {
		name: QUERY_PURCHASES_KEY,
		query: { path: REST_API_SITE_PURCHASES_ENDPOINT },
		options: { enabled: isSiteConnected },
	} );

	const { isLoading, isError } = response;
	const purchases = response.data as Purchase[];

	const isDataLoaded = purchases && ! isLoading && ! isError;
	const numberOfPurchases = isDataLoaded ? purchases.length : 0;

	return (
		<div className={ styles.container }>
			<PlanSectionHeader numberOfPurchases={ numberOfPurchases } />

			<div className={ styles.purchasesSection }>
				{ isDataLoaded &&
					purchases.map( purchase => (
						<PlanSection key={ `purchase-${ purchase.product_name }` } purchase={ purchase } />
					) ) }
			</div>
			{ userIsAdmin && <PlanSectionFooter numberOfPurchases={ numberOfPurchases } /> }
		</div>
	);
};

export default PlansSection;
