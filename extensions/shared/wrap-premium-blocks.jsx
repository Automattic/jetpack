/**
 * Internal dependencies
 */
import UpgradeNudge from './upgrade-nudge';

export default WrappedComponent => props => (
	// Wraps the input component in a container, without mutating it. Good!
	<div className="premium-blocks__wrapper">
		<UpgradeNudge />
		<div className="premium-blocks__disabled">
			<WrappedComponent { ...props } />
		</div>
	</div>
);
