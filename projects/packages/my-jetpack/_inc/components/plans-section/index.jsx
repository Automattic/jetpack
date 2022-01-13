/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import usePurchases from '../../hooks/use-purchases';
import './style.scss';

/**
 * Basic plan section component.
 *
 * @param {object} props          - Component props.
 * @param {object} props.purchase - Purchase object.
 * @returns {object} PlanSection React component.
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
 * Plan section component.
 *
 * @returns {object} PlansSection React component.
 */
export default function PlansSection() {
	const purchases = usePurchases();

	return (
		<div className="jp-plans-section">
			<h3>{ __( 'My Plan', 'jetpack-my-jetpack' ) }</h3>
			<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-my-jetpack' ) }</p>

			<div className="jp-plans-section__plan-card">
				{ purchases.map( purchase => (
					<PlanSection purchase={ purchase } />
				) ) }
			</div>
		</div>
	);
}
