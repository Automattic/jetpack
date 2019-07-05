/**
 * External dependencies
 */
import classNames from 'classnames';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import UpgradeNudge from '../upgrade-nudge';

import './style.scss';

export default ( { requiredPlan } ) =>
	createHigherOrderComponent(
		WrappedComponent => props => (
			// Wraps the input component in a container, without mutating it. Good!
			<div
				className={ classNames( 'jetpack-paid-block__wrapper', {
					'is-selected': props.isSelected,
				} ) }
			>
				<UpgradeNudge plan={ requiredPlan } />
				<WrappedComponent { ...props } />
			</div>
		),
		'wrapPaidBlock'
	);
