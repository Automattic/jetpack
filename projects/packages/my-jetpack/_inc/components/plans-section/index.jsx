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
import './style.scss';

import usePlan from '../../hooks/use-plan';

/**
 * Plan section component.
 *
 * @returns {object} PlansSection React component.
 */
export default function PlansSection() {
	const { name, billingPeriod } = usePlan();
	return (
		<div className="jp-plans-section">
			<h3>{ __( 'My Plan', 'jetpack-my-jetpack' ) }</h3>
			<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-my-jetpack' ) }</p>

			<h4>{ name }</h4>
			<p>{ billingPeriod }</p>
		</div>
	);
}
