import { __ } from '@wordpress/i18n';
import Status from '../status/status';
import {
	calculateCriticalCssProgress,
	useCriticalCssState,
} from '../lib/stores/critical-css-state';
import { getCriticalCssIssues } from '../lib/critical-css-errors';
import { useRetryRegenerate } from '../lib/use-retry-regenerate';

export default function CloudCssMetaProps() {
	const [ cssState ] = useCriticalCssState();
	const [ hasRetried, retry ] = useRetryRegenerate();

	const progress = calculateCriticalCssProgress( cssState.providers );

	return (
		<Status
			cssState={ cssState }
			isCloud={ true }
			hasRetried={ hasRetried }
			retry={ retry }
			status={ cssState.status }
			issues={ getCriticalCssIssues( cssState ) }
			updated={ cssState.updated }
			progress={ progress }
			showRegenerateButton={ false }
			generateText={ __(
				'Jetpack Boost will generate Critical CSS for you automatically.',
				'jetpack-boost'
			) }
			generateMoreText={ __( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' ) }
		/>
	);
}
