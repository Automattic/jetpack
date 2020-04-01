/**
 * External dependencies
 */
import { Fragment } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import UpgradeNudge from './components/upgrade-nudge';

export default ( { requiredPlan, customTitle, customSubTitle } ) =>
	createHigherOrderComponent(
		WrappedComponent => props => (
			// Wraps the input component in a container, without mutating it. Good!
			<Fragment>
				{ ( ! props?.attributes?.__isBlockPreview ?? false ) && (
					<UpgradeNudge
						plan={ requiredPlan }
						blockName={ props.name }
						title={ customTitle }
						subtitle={ customSubTitle }
					/>
				) }
				<WrappedComponent { ...props } />
			</Fragment>
		),
		'wrapPaidBlock'
	);
