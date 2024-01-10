import { __ } from '@wordpress/i18n';
import { CriticalCssState } from '../lib/stores/critical-css-state-types';
import Status from '../status/status';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import ProgressBar from '$features/ui/progress-bar/progress-bar';
import styles from './critical-css-meta.module.scss';
import { useState } from '@wordpress/element';
import { ErrorSet } from '../lib/stores/critical-css-state-errors';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import {
	useCriticalCssState,
	useLocalGenerator,
	useRegenerateCriticalCssAction,
} from '../lib/stores/critical-css-state';

type CriticalCssMetaProps = {
	isCloudCssAvailable: boolean;
	issues: CriticalCssState[ 'providers' ];
	isFatalError: boolean;
	primaryErrorSet: ErrorSet;
	suggestRegenerate: boolean;
};

const CriticalCssMeta: React.FC< CriticalCssMetaProps > = ( {
	isCloudCssAvailable,
	issues = [],
	isFatalError,
	primaryErrorSet,
	suggestRegenerate,
} ) => {
	const [ hasRetried, setHasRetried ] = useState( false );
	const [ cssState ] = useCriticalCssState();
	const regenerate = useRegenerateCriticalCssAction();

	const successCount = cssState.providers
		? cssState.providers.filter( provider => provider.status === 'success' ).length
		: 0;

	function retry() {
		setHasRetried( true );
		regenerate();
	}

	const progress = useLocalGenerator();

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
			progress={ progress }
			suggestRegenerate={ suggestRegenerate }
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
