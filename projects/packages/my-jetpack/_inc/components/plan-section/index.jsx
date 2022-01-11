/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Plan section component.
 *
 * @returns {object} PlanSection React component.
 */
export default function PlanSection() {
	return <h1>{ __( 'My Plan', 'jetpack-my-jetpack' ) }</h1>;
}
