/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import usePlan from '../../hooks/use-plan';

/**
 * Plan section component.
 *
 * @returns {object} PlansSection React component.
 */
export default function PlansSection() {
	const { name, billingPeriod } = usePlan();
	return (
		<div>
			<h1>{ __( 'My Plan', 'jetpack-my-jetpack' ) }</h1>
			<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-my-jetpack' ) }</p>

			<h2>{ name }</h2>
			<p>{ billingPeriod }</p>
		</div>
	);
}
