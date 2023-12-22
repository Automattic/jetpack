import { __, _n, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import { regenerateCriticalCss } from '../lib/stores/critical-css-state';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';
import TimeAgo from '../time-ago/time-ago';
import InfoIcon from '$svg/info';
import RefreshIcon from '$svg/refresh';
import { createInterpolateElement } from '@wordpress/element';
import actionLinkInterpolateVar from '$lib/utils/action-link-interpolate-var';
import { navigate } from '$lib/utils/navigate';

type StatusTypes = {
	status: CriticalCssState[ 'status' ];
	updated: CriticalCssState[ 'updated' ];
	progress: number;
	suggestRegenerate: unknown;
	isCloudCssAvailable?: boolean;
	issues?: CriticalCssState[ 'providers' ];
	successCount?: number;
	generateText?: string;
	generateMoreText?: string;
};

const Status: React.FC< StatusTypes > = ( {
	status,
	updated,
	progress,
	suggestRegenerate,
	isCloudCssAvailable = false,
	issues = [],
	successCount = 0,
	generateText = '',
	generateMoreText = '',
} ) => {
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
							{ updated && (
								<>
									{ ' ' }
									<TimeAgo time={ new Date( updated * 1000 ) } />
									{ '.' }
								</>
							) }
							{ ! isCloudCssAvailable && (
								<>
									{ ' ' }
									{ __(
										'Remember to regenerate each time you make changes that affect your HTML or CSS structure.',
										'jetpack-boost'
									) }
								</>
							) }
							{ progress < 100 && (
								<>
									{ ' ' }
									<span>{ generateMoreText }</span>
								</>
							) }
						</div>

						{ status !== 'pending' && issues.length > 0 && (
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
											...actionLinkInterpolateVar(
												() => navigate( 'critical-css-advanced' ),
												'advanced'
											),
										}
									) }
								</>
							</div>
						) }
					</>
				) }
			</div>
			{ status !== 'pending' && (
				<button
					type="button"
					className={ classNames( 'components-button', {
						'is-link': ! suggestRegenerate || isCloudCssAvailable,
					} ) }
					onClick={ regenerateCriticalCss }
				>
					<RefreshIcon />
					{ __( 'Regenerate', 'jetpack-boost' ) }
				</button>
			) }
		</div>
	);
};

export default Status;
