/**
 * Internal dependencies
 */
import UpgradeNudge from './upgrade-nudge';

export default ( WrappedComponent, requiredPlan ) => props => (
	// Wraps the input component in a container, without mutating it. Good!
	<div className="paid-block__wrapper">
		<UpgradeNudge requiredPlan={ requiredPlan } />
		<div className="paid-block__disabled">
			<WrappedComponent { ...props } />
		</div>
	</div>
);
