import { __, _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';
import TimeAgo from '../time-ago/time-ago';
import InfoIcon from '$svg/info';
import RefreshIcon from '$svg/refresh';
import { createInterpolateElement } from '@wordpress/element';
import { Link } from 'react-router-dom';
import { useRegenerateCriticalCssAction } from '../lib/stores/critical-css-state';
import { getProvidersWithErrors } from '../lib/critical-css-errors';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import { Button } from '@automattic/jetpack-components';
import styles from './status.module.scss';

type StatusTypes = {
	cssState: CriticalCssState;
	isCloud?: boolean;
	showFatalError: boolean;
	hasRetried: boolean;
	retry: () => void;
	highlightRegenerateButton?: boolean;
	extraText?: string; // Optionally, provide a sentence to use after the main message to provide more context.
	overrideText?: string; // Optionally, provide a custom message to display instead of the default.
};

const Status: React.FC< StatusTypes > = ( {
	cssState,
	isCloud = false,
	showFatalError,
	hasRetried,
	retry,
	highlightRegenerateButton = false,
	extraText,
	overrideText,
} ) => {
	const regenerateAction = useRegenerateCriticalCssAction();
	const successCount =
		cssState.providers.filter( provider => provider.status === 'success' ).length || 0;
	const providersWithErrors = getProvidersWithErrors( cssState );

	// If there has been a fatal error, show it.
	if ( showFatalError ) {
		return (
			<ShowStopperError
				supportLink={ ( isCloud && 'https://jetpack.com/contact-support/' ) || undefined }
				cssState={ cssState }
				retry={ retry }
				showRetry={ ! hasRetried }
			/>
		);
	}

	return (
		<div className={ styles.status } data-testid="critical-css-meta">
			<div className={ styles.summary }>
				{ overrideText || (
					<div className={ styles.successes }>
						{ sprintf(
							/* translators: %d is a number of CSS Files which were successfully generated */
							_n( '%d file generated', '%d files generated', successCount, 'jetpack-boost' ),
							successCount
						) }

						{ !! cssState.updated && (
							<>
								{ ' ' }
								<TimeAgo time={ new Date( cssState.updated * 1000 ) } />
							</>
						) }

						{ '. ' }

						{ extraText }
					</div>
				) }

				{ cssState.status !== 'pending' && providersWithErrors.length > 0 && (
					<div className={ clsx( 'failures', styles.failures ) }>
						<InfoIcon />

						<>
							{ createInterpolateElement(
								sprintf(
									// translators: %d is a number of CSS Files which failed to generate
									_n(
										'%d file could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize this file.',
										'%d files could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize these files.',
										providersWithErrors.length,
										'jetpack-boost'
									),
									providersWithErrors.length
								),
								{
									advanced: <Link to="/critical-css-advanced" />,
								}
							) }
						</>
					</div>
				) }
			</div>

			<Button
				className={ styles[ 'regenerate-button' ] }
				variant={ highlightRegenerateButton ? 'primary' : 'link' }
				size="small"
				weight="regular"
				onClick={ () => regenerateAction.mutate() }
				icon={ highlightRegenerateButton ? undefined : <RefreshIcon /> }
				disabled={ cssState.status === 'pending' }
			>
				{ __( 'Regenerate', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};

export default Status;
