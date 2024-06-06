import { useNavigate } from 'react-router-dom';
import actionLinkInterpolateVar from '$lib/utils/action-link-interpolate-var';
import { InterpolateVars } from '$lib/utils/interplate-vars-types';
import supportLinkInterpolateVar from '$lib/utils/support-link-interpolate-var';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';
import { suggestion } from '$features/critical-css/lib/describe-critical-css-recommendations';
import { ErrorSet } from '$features/critical-css/lib/critical-css-errors';

function getCriticalCssErrorSetInterpolateVars( errorSet: ErrorSet ) {
	const regenerateAction = useRegenerateCriticalCssAction();
	const navigate = useNavigate();

	function retry() {
		regenerateAction.mutate();
		navigate( '/' );
	}

	const interpolateVars: InterpolateVars = {
		...actionLinkInterpolateVar( retry, 'retry' ),
		...supportLinkInterpolateVar(),
		b: <b />,
	};

	if ( 'listLink' in suggestion( errorSet ) ) {
		interpolateVars.link = (
			// eslint-disable-next-line jsx-a11y/anchor-has-content
			<a href={ suggestion( errorSet ).listLink } target="_blank" rel="noreferrer" />
		);
	}

	return interpolateVars;
}

export default getCriticalCssErrorSetInterpolateVars;
