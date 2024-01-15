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

type StatusTypes = {
	cssState: CriticalCssState;

	isCloud?: boolean;

	hasRetried: boolean;
	retry: () => void;

	highlightRegenerateButton?: boolean;

	generateText?: string;
	generateMoreText?: string;
};

const Status: React.FC< StatusTypes > = ( {
	cssState,
	isCloud = false,
	hasRetried,
	retry,

	highlightRegenerateButton = false,
	generateText = '',
	generateMoreText = '',
} ) => {
	const regenerateAction = useRegenerateCriticalCssAction();
	const successCount =
		cssState.providers.filter( provider => provider.status === 'success' ).length || 0;
	const pendingCount =
		cssState.providers.filter( provider => provider.status === 'pending' ).length || 0;
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

	return (
		<div className="jb-critical-css__meta">
			<div className="summary">
				{ successCount === 0 ? (
					<div className="generating">{ generateText }</div>
				) : (
					<>
						<div className="successes">
							{ sprintf(
								/* translators: %d is a number of CSS Files which were successfully generated */
								_n( '%d file generated', '%d files generated', successCount, 'jetpack-boost' ),
								successCount
							) }
							{ cssState.updated && (
								<>
									{ ' ' }
									<TimeAgo time={ new Date( cssState.updated * 1000 ) } />
									{ '.' }
								</>
							) }
							{ ! isCloud && (
								<>
									{ ' ' }
									{ __(
										'Remember to regenerate each time you make changes that affect your HTML or CSS structure.',
										'jetpack-boost'
									) }
								</>
							) }
							{ pendingCount > 0 && (
								<>
									{ ' ' }
									<span>{ generateMoreText }</span>
								</>
							) }
						</div>

						{ cssState.status !== 'pending' && issues.length > 0 && (
							<div className="failures">
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
					</>
				) }
			</div>
			{ cssState.status !== 'pending' && (
				<Button
					type="button"
					className={ classNames( 'components-button', {
						'is-link': ! highlightRegenerateButton || isCloud,
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
