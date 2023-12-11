import React from 'react';
import { sprintf, __ } from '@wordpress/i18n';
import OtherGroupContext from '$features/image-size-analysis/other-group-context/other-group-context';
import { isaGroupLabel } from '../lib/stores/isa-summary';
import ConditionalLink from '$features/image-size-analysis/conditional-link/conditional-link';
import ProgressBar from '$features/image-size-analysis/progress-bar/progress-bar';
import { Spinner } from '$features/ui';
import WarningIcon from '$svg/warning-outline';

interface SummaryProgress {
	group: string;
	issue_count?: number;
	scanned_pages?: number;
	total_pages?: number;
	progress: number;
	done: boolean;
	has_issues: boolean;
}

interface MultiProgressProps {
	summaryProgress: SummaryProgress[];
}

const MultiProgress: React.FC< MultiProgressProps > = ( { summaryProgress } ) => {
	return (

		<div className="jb-multi-progress">
			{ summaryProgress.map( ( summary, index ) => (
				<div key={ index } className="jb-entry">
					<div className="jb-progress">
						<ProgressBar progress={ summary.progress } />
					</div>

					{ summary.progress > 0 && summary.progress < 100 ? (
						<Spinner />
					) : (
						<ConditionalLink
							isLink={ summary.has_issues }
							className="jb-navigator-link"
							to={ `/image-size-analysis/${ summary.group }/1` }
							trackEvent="clicked_isa_group_on_summary_page"
							trackEventProps={ summary.group }
						>
							<span
								className={ `jb-bubble ${ summary.done ? 'done' : '' } ${
									summary.has_issues ? 'has-issues' : ''
								}` }
							>
								{ summary.has_issues ? (
									<WarningIcon className="icon" />
								) : summary.done ? (
									'✓'
								) : (
									index + 1
								) }
							</span>
						</ConditionalLink>
					) }

					<div className="jb-category-name">
						<ConditionalLink
							isLink={ summary.has_issues }
							className="jb-navigator-link"
							to={ `/image-size-analysis/${ summary.group }/1` }
							trackEvent="clicked_isa_group_on_summary_page"
							trackEventProps={ summary.group }
						>
							{ isaGroupLabel( summary.group ) }
						</ConditionalLink>
						{ summary.group === 'other' && <OtherGroupContext /> }
					</div>

					{ ( summary.done || summary.has_issues ) && (
						<div className={ `jb-status ${ summary.has_issues ? 'has-issues' : '' }` }>
							<ConditionalLink
								isLink={ summary.has_issues }
								className="jb-navigator-link"
								to={ `/image-size-analysis/${ summary.group }/1` }
								trackEvent="clicked_isa_group_on_summary_page"
								trackEventProps={ summary.group }
							>
								{ summary.has_issues
									// translators: %d: The number of issues
									? sprintf( __( '%d issues', 'jetpack-boost' ), summary.issue_count )
									: __( 'No issues', 'jetpack-boost' ) }
							</ConditionalLink>
						</div>
					) }
				</div>
			) ) }
		</div>
	);
};

export default MultiProgress;
