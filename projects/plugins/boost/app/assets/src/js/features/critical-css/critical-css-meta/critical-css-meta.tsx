import { __ } from '@wordpress/i18n';
import Status from '../status/status';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import ProgressBar from '$features/ui/progress-bar/progress-bar';
import styles from './critical-css-meta.module.scss';
import { useCriticalCssState } from '../lib/stores/critical-css-state';
import { getCriticalCssIssues, isFatalError } from '../lib/critical-css-errors';
import { RegenerateCriticalCssSuggestion, useRegenerationReason } from '..';
import { useLocalCriticalCssGenerator } from '../local-generator/local-generator-provider';
import { useRetryRegenerate } from '../lib/use-retry-regenerate';

/**
 * Critical CSS Meta - the information and options displayed under the Critical CSS toggle on the
 * Settings page when the feature is enabled.
 */
export default function CriticalCssMeta() {
	const [ hasRetried, retry ] = useRetryRegenerate();
	const [ cssState ] = useCriticalCssState();
	const [ regenerateReason ] = useRegenerationReason();

	const successCount = cssState.providers
		? cssState.providers.filter( provider => provider.status === 'success' ).length
		: 0;

	const { progress } = useLocalCriticalCssGenerator();

	if ( cssState.status === 'pending' ) {
		return (
			<div className="jb-critical-css-progress">
				<div className={ styles[ 'progress-label' ] }>
					{ __(
						'Generating Critical CSS. Please don’t leave this page until completed.',
						'jetpack-boost'
					) }
				</div>
				<ProgressBar progress={ progress } />
			</div>
		);
	} else if ( isFatalError( cssState ) ) {
		return <ShowStopperError cssState={ cssState } retry={ retry } showRetry={ ! hasRetried } />;
	}

	return (
		<>
			<Status
				isCloudCssAvailable={ false }
				status={ cssState.status }
				issues={ getCriticalCssIssues( cssState ) }
				successCount={ successCount }
				updated={ cssState.updated }
				progress={ progress }
				showRegenerateButton={ !! regenerateReason }
			/>

			<RegenerateCriticalCssSuggestion regenerateReason={ regenerateReason } />
		</>
	);
}
