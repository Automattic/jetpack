import { __ } from '@wordpress/i18n';
import { CriticalCssState } from '../lib/stores/critical-css-state-types';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import Status from '../status/status';
import { useState } from '@wordpress/element';
import { ErrorSet } from '../lib/stores/critical-css-state-errors';

type CloudCssMetaProps = {
	cssState: CriticalCssState;
	isCloudCssAvailable: boolean;
	criticalCssProgress: number;
	issues: CriticalCssState[ 'providers' ];
	isFatalError: boolean;
	primaryErrorSet: ErrorSet;
	suggestRegenerate: boolean;
	regenerateCriticalCss: () => void;
};

const CloudCssMeta: React.FC< CloudCssMetaProps > = ( {
	cssState,
	isCloudCssAvailable,
	criticalCssProgress,
	issues = [],
	isFatalError,
	primaryErrorSet,
	suggestRegenerate,
	regenerateCriticalCss,
} ) => {
	const [ hasRetried, setHasRetried ] = useState( false );

	const successCount = cssState.providers.filter(
		provider => provider.status === 'success'
	).length;

	function retry() {
		setHasRetried( true );
		regenerateCriticalCss();
	}

	return isFatalError ? (
		<ShowStopperError
			supportLink="https://jetpackme.wordpress.com/contact-support/"
			status={ cssState.status }
			primaryErrorSet={ primaryErrorSet }
			statusError={ cssState.status_error }
			regenerateCriticalCss={ retry }
			showRetry={ ! hasRetried }
		/>
	) : (
		<Status
			isCloudCssAvailable={ isCloudCssAvailable }
			status={ cssState.status }
			successCount={ successCount }
			issues={ issues }
			updated={ cssState.updated }
			progress={ criticalCssProgress }
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
