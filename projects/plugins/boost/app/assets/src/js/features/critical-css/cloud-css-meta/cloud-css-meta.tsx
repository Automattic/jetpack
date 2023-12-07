import { __ } from '@wordpress/i18n';
import { CriticalCssState } from '../lib/stores/critical-css-state-types';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import Status from '../status/status';

type CloudCssMetaProps = {
	cssState: CriticalCssState;
	isCloudCssAvailable: boolean;
	criticalCssProgress: number;
	issues: CriticalCssState[ 'providers' ];
	isFatalError: boolean;
	primaryErrorSet;
	suggestRegenerate;
	regenerateCriticalCss;
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
	const successCount = cssState.providers.filter(
		provider => provider.status === 'success'
	).length;

	return isFatalError ? (
		<ShowStopperError
			supportLink="https://jetpackme.wordpress.com/contact-support/"
			status={ cssState.status }
			primaryErrorSet={ primaryErrorSet }
			statusError={ cssState.status_error }
			regenerateCriticalCss={ regenerateCriticalCss }
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
