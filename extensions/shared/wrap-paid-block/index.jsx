/**
 * External dependencies
 */

import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import UpgradeNudge from '../upgrade-nudge';

import './style.scss';

export default ( { feature, requiredPlan } ) =>
	createHigherOrderComponent(
		WrappedComponent => props => (
			// Wraps the input component in a container, without mutating it. Good!
			<div className="jetpack-paid-block__wrapper">
				<UpgradeNudge feature={ feature } plan={ requiredPlan } />
				<div className="jetpack-paid-block__disabled">
					<WrappedComponent { ...props } />
				</div>
			</div>
		),
		'wrapPaidBlock'
	);
