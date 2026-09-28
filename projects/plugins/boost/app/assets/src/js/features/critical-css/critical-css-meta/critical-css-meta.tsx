import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useModuleSurface } from '$features/module/surface';
import ModernCriticalCssStatus from './modern-critical-css-status';
import Status from '../status/status';
import ProgressBar from '$features/ui/progress-bar/progress-bar';
import styles from './critical-css-meta.module.scss';
import { criticalCssErrorState, useCriticalCssState } from '../lib/stores/critical-css-state';
import { RegenerateCriticalCssSuggestion, useRegenerationReason } from '..';
import { useLocalCriticalCssGenerator } from '../critical-css-context/critical-css-context-provider';
import { isFatalError } from '../lib/critical-css-errors';

/**
 * Critical CSS Meta - the information and options displayed under the Critical CSS toggle on the
 * Settings page when the feature is enabled.
 */
export default function CriticalCssMeta() {
	const isModern = useModuleSurface() === 'row';
	const [ cssState ] = useCriticalCssState();
	const [ { data: regenerateReason } ] = useRegenerationReason();
	const { isGenerating, progress, stoppedRun } = useLocalCriticalCssGenerator( ! isModern );
	const showFatalError = isFatalError( cssState );

	if ( stoppedRun?.sessionExpired ) {
		return (
			<Notice.Root intent="error">
				<Notice.Title>{ __( 'Your session has expired', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>
					{ __(
						'Critical CSS generation has stopped. Log in again, then reload this page to continue.',
						'jetpack-boost'
					) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	if ( stoppedRun ) {
		return (
			<Status
				cssState={ criticalCssErrorState( stoppedRun.message ) }
				isCloud={ false }
				showFatalError={ true }
			/>
		);
	}

	if ( isModern && ! showFatalError ) {
		return (
			<>
				<ModernCriticalCssStatus
					cssState={ cssState }
					isGenerating={ isGenerating }
					progress={ progress }
				/>
				{ ! isGenerating &&
					( cssState.status === 'generated' || cssState.status === 'not_generated' ) && (
						<RegenerateCriticalCssSuggestion regenerateReason={ regenerateReason } />
					) }
			</>
		);
	}

	// Keep the progress bar visible while the local generator is still finishing,
	// even if the server status has already flipped to 'generated'.  This ensures
	// the bar has time to visually reach 100% before switching to the completed view.
	const showProgressBar =
		cssState.status === 'pending' || cssState.status === 'not_generated' || isGenerating;

	if ( showProgressBar ) {
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
				showFatalError={ showFatalError }
				highlightRegenerateButton={ !! regenerateReason }
				extraText={ __(
					'Remember to regenerate each time you make changes that affect your HTML or CSS structure.',
					'jetpack-boost'
				) }
			/>

			{ ! showFatalError && (
				<RegenerateCriticalCssSuggestion regenerateReason={ regenerateReason } />
			) }
		</>
	);
}
