/**
 * External dependencies
 */
import React from 'react';
import { __, _n } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import usePurchases from '../../hooks/use-purchases';
import getManageYourPlanUrl from '../../utils/get-manage-your-plan-url';
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
			<h4>{ product_name }</h4>
			<p>{ expiry_message }</p>
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
	let planLinkDescription = __( 'Purchase a plan', 'jetpack-my-jetpack' );
	if ( purchases.length > 1 ) {
		/* translators: %d: number of site plans. */
		planLinkDescription = _n(
			'Manage your plan.',
			'Manage your plans',
			purchases.length,
			'jetpack-my-jetpack'
		);
	}

	return (
		<>
			<h3>
				{ purchases.length <= 1
					? __( 'My plan', 'jetpack-my-jetpack' )
					: __( 'My plans', 'jetpack-my-jetpack' ) }
			</h3>
			<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-my-jetpack' ) }</p>
			<p>
				<ExternalLink className={ styles[ 'external-link' ] } href={ getManageYourPlanUrl() }>
					{ planLinkDescription }
				</ExternalLink>
			</p>
		</>
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

			<div className="jp-plans-section__purchases-section">
				{ purchases.map( purchase => (
					<PlanSection key={ `purchase-${ purchase.product_name }` } purchase={ purchase } />
				) ) }
			</div>
		</div>
	);
}
