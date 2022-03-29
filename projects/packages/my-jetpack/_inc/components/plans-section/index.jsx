/**
 * External dependencies
 */
import React from 'react';
import { __, _n } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { Text, H2, Title } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
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
			<H2>
				{ purchases.length <= 1
					? __( 'Your plan', 'jetpack-my-jetpack' )
					: __( 'Your plans', 'jetpack-my-jetpack' ) }
			</H2>
			{ purchases.length === 0 && (
				<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-my-jetpack' ) }</p>
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
	let planLinkDescription = __( 'Purchase a plan', 'jetpack-my-jetpack' );
	if ( purchases.length >= 1 ) {
		planLinkDescription = _n(
			'Manage your plan',
			'Manage your plans',
			purchases.length,
			'jetpack-my-jetpack'
		);
	}

	return (
		<p>
			<ExternalLink
				className={ styles[ 'external-link' ] }
				href={ purchases.length ? getManageYourPlanUrl() : getPurchasePlanUrl() }
			>
				{ planLinkDescription }
			</ExternalLink>
		</p>
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
