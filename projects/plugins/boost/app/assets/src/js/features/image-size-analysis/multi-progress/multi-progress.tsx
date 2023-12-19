import React from 'react';
import { sprintf, __ } from '@wordpress/i18n';
import OtherGroupContext from '$features/image-size-analysis/other-group-context/other-group-context';
import { type isGroupLabels, getGroupLabel } from '../lib/isa-groups';
import ConditionalLink from '$features/image-size-analysis/conditional-link/conditional-link';
import ProgressBar from '$features/image-size-analysis/progress-bar/progress-bar';
import { Spinner } from '$features/ui';
import WarningIcon from '$svg/warning-outline';

interface ReportProgress {
	group: isGroupLabels;
	issue_count?: number;
	scanned_pages?: number;
	total_pages?: number;
	progress: number;
	done: boolean;
	has_issues: boolean;
}

interface MultiProgressProps {
	reportProgress: ReportProgress[];
}

const MultiProgress: React.FC< MultiProgressProps > = ( { reportProgress } ) => {
	return (
		<div className="jb-multi-progress">
			{ reportProgress.map( ( report, index ) => (
				<div key={ index } className="jb-entry">
					<div className="jb-progress">
						<ProgressBar progress={ report.progress } />
					</div>

					{ report.progress > 0 && report.progress < 100 ? (
						<Spinner />
					) : (
						<ConditionalLink
							isLink={ report.has_issues }
							className="jb-navigator-link"
							to={ `/image-size-analysis/${ report.group }/1` }
							trackEvent="clicked_isa_group_on_report_page"
							trackEventProps={ report.group }
						>
							<span
								className={ `jb-bubble ${ report.done ? 'done' : '' } ${
									report.has_issues ? 'has-issues' : ''
								}` }
							>
								{ report.has_issues ? <WarningIcon /> : report.done ? '✓' : index + 1 }
							</span>
						</ConditionalLink>
					) }

					<div className="jb-category-name">
						<ConditionalLink
							isLink={ report.has_issues }
							className="jb-navigator-link"
							to={ `/image-size-analysis/${ report.group }/1` }
							trackEvent="clicked_isa_group_on_report_page"
							trackEventProps={ report.group }
						>
							{ getGroupLabel( report.group ) }
						</ConditionalLink>
						{ report.group === 'other' && <OtherGroupContext /> }
					</div>

					{ ( report.done || report.has_issues ) && (
						<div className={ `jb-status ${ report.has_issues ? 'has-issues' : '' }` }>
							<ConditionalLink
								isLink={ report.has_issues }
								className="jb-navigator-link"
								to={ `/image-size-analysis/${ report.group }/1` }
								trackEvent="clicked_isa_group_on_report_page"
								trackEventProps={ report.group }
							>
								{ report.has_issues
									? // translators: %d: The number of issues
									  sprintf( __( '%d issues', 'jetpack-boost' ), report.issue_count )
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
