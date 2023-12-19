import { __ } from '@wordpress/i18n';
import { CriticalCssState } from '../lib/stores/critical-css-state-types';
import Status from '../status/status';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import ProgressBar from '$features/ui/progress-bar/progress-bar';
import styles from './critical-css-meta.module.scss';
import { useState } from '@wordpress/element';

type CriticalCssMetaProps = {
	cssState: CriticalCssState;
	isCloudCssAvailable: boolean;
	criticalCssProgress: number;
	issues: CriticalCssState[ 'providers' ];
	isFatalError: boolean;
	primaryErrorSet;
	suggestRegenerate;
	regenerateCriticalCss;
};

const CriticalCssMeta: React.FC< CriticalCssMetaProps > = ( {
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

	const successCount = cssState.providers
		? cssState.providers.filter( provider => provider.status === 'success' ).length
		: 0;

	function retry() {
		setHasRetried( true );
		regenerateCriticalCss();
	}

	if ( cssState.status === 'pending' ) {
		return (
			<div className="jb-critical-css-progress">
				<div className={ styles[ 'progress-label' ] }>
					{ __(
						'Generating Critical CSS. Please don’t leave this page until completed.',
						'jetpack-boost'
					) }
				</div>
				<ProgressBar progress={ criticalCssProgress } />
			</div>
		);
	} else if ( isFatalError ) {
		return (
			<ShowStopperError
				status={ cssState.status }
				primaryErrorSet={ primaryErrorSet }
				statusError={ cssState.status_error }
				regenerateCriticalCss={ retry }
				showRetry={ ! hasRetried }
			/>
		);
	}

	return (
		<Status
			isCloudCssAvailable={ isCloudCssAvailable }
			status={ cssState.status }
			successCount={ successCount }
			updated={ cssState.updated }
			issues={ issues }
			progress={ criticalCssProgress }
			suggestRegenerate={ suggestRegenerate }
		/>
	);
};

export default CriticalCssMeta;
