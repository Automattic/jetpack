import { Text, H3, Title, Button } from '@automattic/jetpack-components';
import { __, _n } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import usePurchases from '../../data/purchases/use-purchases';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import getManageYourPlanUrl from '../../utils/get-manage-your-plan-url';
import getPurchasePlanUrl from '../../utils/get-purchase-plan-url';
import { isLifetimePurchase } from '../../utils/is-lifetime-purchase';
import { GoldenTokenTooltip } from '../golden-token/tooltip';
import styles from './style.module.scss';

/**
 * Basic plan section component.
 *
 * @param {object} props          - Component props.
 * @param {object} props.purchase - Purchase object.
 * @returns {object} PlanSection react component.
 */
function PlanSection( { purchase = {} } ) {
	const { product_name } = purchase;
	return (
		<>
			<Title>{ product_name }</Title>
			<PlanExpiry { ...purchase } />
		</>
	);
}

/**
 * Plan expiry component.
 *
 * @param {object} purchase - WPCOM purchase object.
 * @param {string} purchase.product_name - A product name.
 * @param {string} purchase.subscribed_date - A subscribed date.
 * @param {string} purchase.expiry_message - An expiry message.
 * @param {string} purchase.partner_slug - A partner that issued the purchase.
 * @returns {object} - A plan expiry component.
 */
function PlanExpiry( purchase ) {
	const { expiry_message, product_name, subscribed_date } = purchase;

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
		<Text variant="body" className={ styles[ 'expire-date' ] }>
			{ expiry_message }
		</Text>
	);
}

/**
 * Plan section Header component.
 *
 * @param {object} props                   - Component props.
 * @param {number} props.numberOfPurchases - Count of purchases in purchases array.
 * @returns {object} PlanSectionHeader react component.
 */
function PlanSectionHeader( { numberOfPurchases = 0 } ) {
	return (
		<>
			<H3>
				{ numberOfPurchases <= 1
					? __( 'Your plan', 'jetpack-my-jetpack' )
					: __( 'Your plans', 'jetpack-my-jetpack' ) }
			</H3>
			{ numberOfPurchases === 0 && (
				<Text variant="body">{ __( 'Want to power up your Jetpack?', 'jetpack-my-jetpack' ) }</Text>
			) }
		</>
	);
}

/**
 * Plan section Footer component.
 *
 * @param {object} props                   - Component props.
 * @param {number} props.numberOfPurchases - Count of purchases in purchases array.
 * @returns {object} PlanSectionFooter react component.
 */
function PlanSectionFooter( { numberOfPurchases } ) {
	const { recordEvent } = useAnalytics();
	const { isUserConnected } = useMyJetpackConnection();

	let planLinkDescription = __( 'Purchase a plan', 'jetpack-my-jetpack' );
	if ( numberOfPurchases >= 1 ) {
		planLinkDescription = _n(
			'Manage your plan',
			'Manage your plans',
			numberOfPurchases,
			'jetpack-my-jetpack'
		);
	}

	const purchaseClickHandler = useCallback( () => {
		const event = numberOfPurchases
			? 'jetpack_myjetpack_plans_manage_click'
			: 'jetpack_myjetpack_plans_purchase_click';
		recordEvent( event );
	}, [ numberOfPurchases, recordEvent ] );

	const navigateToConnectionPage = useMyJetpackNavigate( '/connection' );
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

	return (
		<ul>
			<li className={ styles[ 'actions-list-item' ] }>
				<Button
					onClick={ purchaseClickHandler }
					href={ numberOfPurchases ? getManageYourPlanUrl() : getPurchasePlanUrl() }
					weight="regular"
					variant="link"
					isExternalLink={ true }
				>
					{ planLinkDescription }
				</Button>
			</li>
			{ window?.myJetpackInitialState?.loadAddLicenseScreen && (
				<li className={ styles[ 'actions-list-item' ] }>
					<Button
						onClick={ activateLicenseClickHandler }
						href={
							isUserConnected
								? `${ window?.myJetpackInitialState?.adminUrl }admin.php?page=my-jetpack#/add-license`
								: undefined
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
}

/**
 * Plan section component.
 *
 * @returns {object} PlansSection React component.
 */
export default function PlansSection() {
	const userIsAdmin = !! window?.myJetpackInitialState?.userIsAdmin;
	const { data: purchases, isLoading, isError } = usePurchases();

	const isDataLoaded = purchases && ! isLoading && ! isError;
	const numberOfPurchases = isDataLoaded ? purchases.length : 0;

	return (
		<div className={ styles.container }>
			<PlanSectionHeader purchases={ numberOfPurchases } />

			<div className={ styles.purchasesSection }>
				{ isDataLoaded &&
					purchases.map( purchase => (
						<PlanSection key={ `purchase-${ purchase.product_name }` } purchase={ purchase } />
					) ) }
			</div>
			{ userIsAdmin && <PlanSectionFooter purchases={ numberOfPurchases } /> }
		</div>
	);
}
