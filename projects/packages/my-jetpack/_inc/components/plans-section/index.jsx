import { Text, H3, Title, Button } from '@automattic/jetpack-components';
import { __, _n } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import usePurchases from '../../hooks/use-purchases';
import getManageYourPlanUrl from '../../utils/get-manage-your-plan-url';
import getPurchasePlanUrl from '../../utils/get-purchase-plan-url';
import styles from './style.module.scss';

/**
 * Basic plan section component.
 *
 * @param {object} props          - Component props.
 * @param {object} props.purchase - Purchase object.
 * @returns {object} PlanSection react component.
 */
function PlanSection( { purchase = {} } ) {
	const { product_name, expiry_message } = purchase;
	return (
		<>
			<Title>{ product_name }</Title>
			<Text variant="body" className={ styles[ 'expire-date' ] }>
				{ expiry_message }
			</Text>
		</>
	);
}

/**
 * Plan section Header component.
 *
 * @param {object} props          - Component props.
 * @param {Array} props.purchases - Purchases array.
 * @returns {object} PlanSectionHeader react component.
 */
function PlanSectionHeader( { purchases } ) {
	return (
		<>
			<H3>
				{ purchases.length <= 1
					? __( 'Your plan', 'jetpack-my-jetpack' )
					: __( 'Your plans', 'jetpack-my-jetpack' ) }
			</H3>
			{ purchases.length === 0 && (
				<Text variant="body">{ __( 'Want to power up your Jetpack?', 'jetpack-my-jetpack' ) }</Text>
			) }
		</>
	);
}

/**
 * Plan section Footer component.
 *
 * @param {object} props          - Component props.
 * @param {Array} props.purchases - Purchases array.
 * @returns {object} PlanSectionFooter react component.
 */
function PlanSectionFooter( { purchases } ) {
	const { recordEvent } = useAnalytics();
	const { isUserConnected } = useMyJetpackConnection();

	let planLinkDescription = __( 'Purchase a plan', 'jetpack-my-jetpack' );
	if ( purchases.length >= 1 ) {
		planLinkDescription = _n(
			'Manage your plan',
			'Manage your plans',
			purchases.length,
			'jetpack-my-jetpack'
		);
	}

	const purchaseClickHandler = useCallback( () => {
		const event = purchases.length
			? 'jetpack_myjetpack_plans_manage_click'
			: 'jetpack_myjetpack_plans_purchase_click';
		recordEvent( event );
	}, [ purchases, recordEvent ] );

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
					href={ purchases.length ? getManageYourPlanUrl() : getPurchasePlanUrl() }
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
	const purchases = usePurchases();

	return (
		<div className={ styles.container }>
			<PlanSectionHeader purchases={ purchases } />

			<div className={ styles.purchasesSection }>
				{ purchases.map( purchase => (
					<PlanSection key={ `purchase-${ purchase.product_name }` } purchase={ purchase } />
				) ) }
			</div>

			<PlanSectionFooter purchases={ purchases } />
		</div>
	);
}
