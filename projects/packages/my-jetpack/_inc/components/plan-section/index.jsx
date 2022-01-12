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
 * @returns {object} PlanSection React component.
 */
export default function PlanSection() {
	const { name } = usePlan();
	return (
		<div>
			<h1>{ __( 'Your plan', 'jetpack-my-jetpack' ) }</h1>
			<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-my-jetpack' ) }</p>
			{ name }
		</div>
	);
}
