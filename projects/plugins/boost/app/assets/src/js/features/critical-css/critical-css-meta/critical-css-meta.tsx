import { __ } from '@wordpress/i18n';
import { CriticalCssState } from '../lib/stores/critical-css-state-types';
import Status from '../status/status';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import ProgressBar from '$features/ui/progress-bar/progress-bar';
import styles from './critical-css-meta.module.scss';
import { useEffect, useState } from '@wordpress/element';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { useCriticalCssState } from '../lib/stores/critical-css-state';
// import generateCriticalCss from '../lib/generate-critical-css';

type CriticalCssMetaProps = {
	isCloudCssAvailable: boolean;
	criticalCssProgress: number;
	issues: CriticalCssState[ 'providers' ];
	isFatalError: boolean;
	primaryErrorSet;
	suggestRegenerate;
};

const CriticalCssMeta: React.FC< CriticalCssMetaProps > = ( {
	isCloudCssAvailable,
	criticalCssProgress,
	issues = [],
	isFatalError,
	primaryErrorSet,
	suggestRegenerate,
} ) => {
	const { cssState, requestRegenerate } = useCriticalCssState( false );
	const [ hasRetried, setHasRetried ] = useState( false );

	const successCount = cssState.providers
		? cssState.providers.filter( provider => provider.status === 'success' ).length
		: 0;

	// Make sure that Critical CSS generation begins when requested.
	useEffect( () => {
		if ( cssState.status === 'not_generated' ) {
			requestRegenerate();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only run when status changes.
	}, [ cssState.status ] );

	function retry() {
		console.log( 'retry' );
		setHasRetried( true );
		requestRegenerate();
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
			regenerateCriticalCss={ requestRegenerate }
		/>
	);
};

export default function ( props: CriticalCssMetaProps ) {
	return (
		<DataSyncProvider>
			<CriticalCssMeta { ...props } />
		</DataSyncProvider>
	);
}
