import { __ } from '@wordpress/i18n';
import Status from '../status/status';
import ProgressBar from '$features/ui/progress-bar/progress-bar';
import styles from './critical-css-meta.module.scss';
import { useCriticalCssState } from '../lib/stores/critical-css-state';
import { getCriticalCssIssues } from '../lib/critical-css-errors';
import { RegenerateCriticalCssSuggestion, useRegenerationReason } from '..';
import { useLocalCriticalCssGenerator } from '../local-generator/local-generator-provider';
import { useRetryRegenerate } from '../lib/use-retry-regenerate';

/**
 * Critical CSS Meta - the information and options displayed under the Critical CSS toggle on the
 * Settings page when the feature is enabled.
 */
export default function CriticalCssMeta() {
	const [ cssState ] = useCriticalCssState();
	const [ hasRetried, retry ] = useRetryRegenerate();
	const [ regenerateReason ] = useRegenerationReason();
	const { progress } = useLocalCriticalCssGenerator();

	const successCount = cssState.providers
		? cssState.providers.filter( provider => provider.status === 'success' ).length
		: 0;

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
	}

	return (
		<>
			<Status
				cssState={ cssState }
				isCloud={ false }
				hasRetried={ hasRetried }
				retry={ retry }
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
