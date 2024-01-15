import { __ } from '@wordpress/i18n';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import Status from '../status/status';
import {
	calculateCriticalCssProgress,
	useCriticalCssState,
} from '../lib/stores/critical-css-state';
import { getCriticalCssIssues, isFatalError } from '../lib/critical-css-errors';
import { useRetryRegenerate } from '../lib/use-retry-regenerate';

export default function CloudCssMetaProps() {
	const [ hasRetried, retry ] = useRetryRegenerate();
	const [ cssState ] = useCriticalCssState();
	const progress = calculateCriticalCssProgress( cssState.providers );

	const successCount = cssState.providers.filter(
		provider => provider.status === 'success'
	).length;

	return isFatalError( cssState ) ? (
		<ShowStopperError
			supportLink="https://jetpackme.wordpress.com/contact-support/"
			cssState={ cssState }
			retry={ retry }
			showRetry={ ! hasRetried }
		/>
	) : (
		<Status
			isCloudCssAvailable={ true }
			status={ cssState.status }
			issues={ getCriticalCssIssues( cssState ) }
			successCount={ successCount }
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
