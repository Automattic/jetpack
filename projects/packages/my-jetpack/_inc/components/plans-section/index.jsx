/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import usePurchases from '../../hooks/use-purchases';
import getManageYourPlanUrl from '../../utils/get-manage-your-plan-url';

import './style.scss';

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
 * @returns {object} PlanSectionHeader react component.
 */
function PlanSectionHeader() {
	return (
		<>
			<h3>{ __( 'My Plan', 'jetpack-my-jetpack' ) }</h1>
			<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-my-jetpack' ) }</p>
			<p>
				<ExternalLink href={ getManageYourPlanUrl() }>
					{ __( 'Manage your plan', 'jetpack-my-jetpack' ) }
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
		<div className="jp-plans-section">
			<PlanSectionHeader />

			<div className="jp-plans-section__purchases-section">
				{ purchases.map( purchase => (
					<PlanSection key={ `purchase-${ purchase.product_name }` } purchase={ purchase } />
				) ) }
			</div>
		</div>
	);
}
