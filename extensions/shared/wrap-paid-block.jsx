/**
 * External dependencies
 */
import { Fragment } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import UpgradeNudge from './components/upgrade-nudge';

export default ( { requiredPlan } ) =>
	createHigherOrderComponent(
		WrappedComponent => props => (
			// Wraps the input component in a container, without mutating it. Good!
			<Fragment>
				<UpgradeNudge plan={ requiredPlan } blockName={ props.name } />
				<WrappedComponent { ...props } />
			</Fragment>
		),
		'wrapPaidBlock'
	);
