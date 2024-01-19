import { __, _n, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';
import TimeAgo from '../time-ago/time-ago';
import InfoIcon from '$svg/info';
import RefreshIcon from '$svg/refresh';
import { createInterpolateElement } from '@wordpress/element';
import { Link } from 'react-router-dom';
import { useRegenerateCriticalCssAction } from '../lib/stores/critical-css-state';
import { getCriticalCssIssues, isFatalError } from '../lib/critical-css-errors';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import { Button } from '@automattic/jetpack-components';
import styles from './status.module.scss';

type StatusTypes = {
	cssState: CriticalCssState;
	isCloud?: boolean;
	hasRetried: boolean;
	retry: () => void;
	highlightRegenerateButton?: boolean;
	extraText?: string; // Optionally, provide a sentence to use after the main message to provide more context.
	overrideText?: string; // Optionally, provide a custom message to display instead of the default.
};

const Status: React.FC< StatusTypes > = ( {
	cssState,
	isCloud = false,
	hasRetried,
	retry,
	highlightRegenerateButton = false,
	extraText,
	overrideText,
} ) => {
	const regenerateAction = useRegenerateCriticalCssAction();
	const successCount =
		cssState.providers.filter( provider => provider.status === 'success' ).length || 0;
	const issues = getCriticalCssIssues( cssState );

	// If there has been a fatal error, show it.
	if ( isFatalError( cssState ) ) {
		return (
			<ShowStopperError
				supportLink={ ( isCloud && 'https://jetpack.com/contact-support/' ) || undefined }
				cssState={ cssState }
				retry={ retry }
				showRetry={ ! hasRetried }
			/>
		);
	}

	// If my parent has provided override text, show it.
	if ( overrideText ) {
		return (
			<div className={ styles.status }>
				<div className={ styles.summary }>{ overrideText }</div>
			</div>
		);
	}

	// Otherwise, show the status.
	return (
		<div className={ styles.status }>
			<div className={ styles.summary }>
				<div className={ styles.successes }>
					{ sprintf(
						/* translators: %d is a number of CSS Files which were successfully generated */
						_n( '%d file generated', '%d files generated', successCount, 'jetpack-boost' ),
						successCount
					) }

					{ cssState.updated && (
						<>
							{ ' ' }
							<TimeAgo time={ new Date( cssState.updated * 1000 ) } />
						</>
					) }

					{ '. ' }

					{ extraText }
				</div>

				{ cssState.status !== 'pending' && issues.length > 0 && (
					<div className={ styles.failures }>
						<InfoIcon />

						<>
							{ createInterpolateElement(
								sprintf(
									// translators: %d is a number of CSS Files which failed to generate
									_n(
										'%d file could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize this file.',
										'%d files could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize these files.',
										issues.length,
										'jetpack-boost'
									),
									issues.length
								),
								{
									advanced: <Link to="/critical-css-advanced" />,
								}
							) }
						</>
					</div>
				) }
			</div>

			{ cssState.status !== 'pending' && (
				<Button
					className={ classNames( {
						'is-link': ! highlightRegenerateButton,
					} ) }
					isPrimary={ highlightRegenerateButton }
					onClick={ () => regenerateAction.mutate() }
				>
					{ ! highlightRegenerateButton && <RefreshIcon /> }
					{ __( 'Regenerate', 'jetpack-boost' ) }
				</Button>
			) }
		</div>
	);
};

export default Status;
