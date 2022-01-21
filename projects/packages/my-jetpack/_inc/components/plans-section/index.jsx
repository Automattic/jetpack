/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { ExternalLink, Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import usePurchases from '../../hooks/use-purchases';
import getManageYourPlanUrl from '../../utils/get-manage-your-plan-url';
import { useProduct } from '../../hooks/use-product';
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
	const { isActive, isFetching, activate, deactivate } = useProduct( 'backup' );

	/**
	 * Set product state handler
	 */
	// @todo: remove this testing code
	const setProductStateHandler = useCallback( () => ( ! isActive ? activate() : deactivate() ), [
		isActive,
		activate,
		deactivate,
	] );

	return (
		<>
			<h3>
				{ purchases.length <= 1
					? __( 'My plan', 'jetpack-my-jetpack' )
					: __( 'My plans', 'jetpack-my-jetpack' ) }
			</h3>
			<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-my-jetpack' ) }</p>
			<p>
				<ExternalLink href={ getManageYourPlanUrl() }>
					{ purchases.length <= 1
						? __( 'Manage your plan', 'jetpack-my-jetpack' )
						: __( 'Manage your plans', 'jetpack-my-jetpack' ) }
				</ExternalLink>

				<Button primary onClick={ setProductStateHandler } disabled={ isFetching }>
					{ isActive
						? __( 'Activate Backup', 'jetpack-my-jetpack' )
						: __( 'Deactivate Backup', 'jetpack-my-jetpack' ) }
				</Button>
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
