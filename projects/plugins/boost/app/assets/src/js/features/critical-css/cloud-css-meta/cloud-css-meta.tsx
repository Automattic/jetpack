import { __ } from '@wordpress/i18n';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import Status from '../status/status';
import { useState } from '@wordpress/element';
import {
	calculateCriticalCssProgress,
	isFatalError,
	useCriticalCssState,
	useRegenerateCriticalCssAction,
} from '../lib/stores/critical-css-state';
import { getCriticalCssIssues } from '../lib/critical-css-errors';

type CloudCssMetaProps = {
	isCloudCssAvailable: boolean;
};

const CloudCssMeta: React.FC< CloudCssMetaProps > = ( { isCloudCssAvailable } ) => {
	const [ hasRetried, setHasRetried ] = useState( false );
	const [ cssState ] = useCriticalCssState();
	const regenerate = useRegenerateCriticalCssAction();
	const progress = calculateCriticalCssProgress( cssState.providers );

	const successCount = cssState.providers.filter(
		provider => provider.status === 'success'
	).length;

	function retry() {
		setHasRetried( true );
		regenerate();
	}

	return isFatalError( cssState ) ? (
		<ShowStopperError
			supportLink="https://jetpackme.wordpress.com/contact-support/"
			cssState={ cssState }
			retry={ retry }
			showRetry={ ! hasRetried }
		/>
	) : (
		<Status
			isCloudCssAvailable={ isCloudCssAvailable }
			status={ cssState.status }
			issues={ getCriticalCssIssues( cssState ) }
			successCount={ successCount }
			updated={ cssState.updated }
			progress={ progress }
			suggestRegenerate={ false }
			generateText={ __(
				'Jetpack Boost will generate Critical CSS for you automatically.',
				'jetpack-boost'
			) }
			generateMoreText={ __( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' ) }
		/>
	);
};

export default CloudCssMeta;
