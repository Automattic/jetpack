import { __ } from '@wordpress/i18n';
import { CriticalCssState } from '../lib/stores/critical-css-state-types';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import Status from '../status/status';
import { useState } from '@wordpress/element';
import { ErrorSet } from '../lib/stores/critical-css-state-errors';
import {
	calculateCriticalCssProgress,
	useCriticalCssState,
	useRegenerateCriticalCssAction,
} from '../lib/stores/critical-css-state';

type CloudCssMetaProps = {
	isCloudCssAvailable: boolean;
	issues: CriticalCssState[ 'providers' ];
	isFatalError: boolean;
	primaryErrorSet: ErrorSet;
	suggestRegenerate: boolean;
};

const CloudCssMeta: React.FC< CloudCssMetaProps > = ( {
	isCloudCssAvailable,
	issues = [],
	isFatalError,
	primaryErrorSet,
	suggestRegenerate,
} ) => {
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

	return isFatalError ? (
		<ShowStopperError
			supportLink="https://jetpackme.wordpress.com/contact-support/"
			status={ cssState.status }
			primaryErrorSet={ primaryErrorSet }
			statusError={ cssState.status_error }
			retry={ retry }
			showRetry={ ! hasRetried }
		/>
	) : (
		<Status
			isCloudCssAvailable={ isCloudCssAvailable }
			status={ cssState.status }
			successCount={ successCount }
			issues={ issues }
			updated={ cssState.updated }
			progress={ progress }
			suggestRegenerate={ suggestRegenerate }
			generateText={ __(
				'Jetpack Boost will generate Critical CSS for you automatically.',
				'jetpack-boost'
			) }
			generateMoreText={ __( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' ) }
		/>
	);
};

export default CloudCssMeta;
