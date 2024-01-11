import { __ } from '@wordpress/i18n';
import Status from '../status/status';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import ProgressBar from '$features/ui/progress-bar/progress-bar';
import styles from './critical-css-meta.module.scss';
import { useEffect, useState } from '@wordpress/element';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import {
	useCriticalCssState,
	useRegenerateCriticalCssAction,
} from '../lib/stores/critical-css-state';
import { getCriticalCssIssues, isFatalError } from '../lib/critical-css-errors';
import { RegenerateCriticalCssSuggestion, useRegenerationReason } from '..';
import { useLocalCriticalCssGenerator } from '../local-generator/local-generator-provider';

type CriticalCssMetaProps = {
	isCloudCssAvailable: boolean;
};

const CriticalCssMeta: React.FC< CriticalCssMetaProps > = ( { isCloudCssAvailable } ) => {
	const [ hasRetried, setHasRetried ] = useState( false );
	const [ cssState ] = useCriticalCssState();
	const regenerateAction = useRegenerateCriticalCssAction();
	const [ regenerateReason ] = useRegenerationReason();

	const successCount = cssState.providers
		? cssState.providers.filter( provider => provider.status === 'success' ).length
		: 0;

	function retry() {
		setHasRetried( true );
		regenerateAction.mutate();
	}

	const { progress } = useLocalCriticalCssGenerator();

	// On mount, check for not_generated status, and request generation if needed.
	useEffect( () => {
		if ( cssState.status === 'not_generated' ) {
			regenerateAction.mutate();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount.
	}, [] );

	if ( cssState.status === 'pending' ) {
		return (
			<div className="jb-critical-css-progress">
				<div className={ styles[ 'progress-label' ] }>
					{ __(
						'Generating Critical CSS. Please don’t leave this page until completed.',
						'jetpack-boost'
					) }
				</div>
				<ProgressBar progress={ progress || 0 } />
			</div>
		);
	} else if ( isFatalError( cssState ) ) {
		return <ShowStopperError cssState={ cssState } retry={ retry } showRetry={ ! hasRetried } />;
	}

	return (
		<>
			<Status
				isCloudCssAvailable={ isCloudCssAvailable }
				status={ cssState.status }
				issues={ getCriticalCssIssues( cssState ) }
				successCount={ successCount }
				updated={ cssState.updated }
				progress={ progress || 0 }
				showRegenerateButton={ !! regenerateReason }
			/>

			<RegenerateCriticalCssSuggestion regenerateReason={ regenerateReason } />
		</>
	);
};

export default function ( props: CriticalCssMetaProps ) {
	return (
		<DataSyncProvider>
			<CriticalCssMeta { ...props } />
		</DataSyncProvider>
	);
}
