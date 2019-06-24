/**
 * Internal dependencies
 */
import UpgradeNudge from './upgrade-nudge';

export default ( WrappedComponent, { feature, requiredPlan } ) => props => (
	// Wraps the input component in a container, without mutating it. Good!
	<div className="paid-block__wrapper">
		<UpgradeNudge feature={ feature } requiredPlan={ requiredPlan } />
		<div className="paid-block__disabled">
			<WrappedComponent { ...props } />
		</div>
	</div>
);
