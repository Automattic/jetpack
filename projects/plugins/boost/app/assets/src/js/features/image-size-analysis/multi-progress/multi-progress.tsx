import clsx from 'clsx';
import React, { MouseEventHandler } from 'react';
import { sprintf, __ } from '@wordpress/i18n';
import OtherGroupContext from '$features/image-size-analysis/other-group-context/other-group-context';
import { type isaGroupKeys, getGroupLabel } from '../lib/isa-groups';
import ProgressBar from '$features/image-size-analysis/progress-bar/progress-bar';
import { Spinner } from '$features/ui';
import WarningIcon from '$svg/warning-outline';
import { recordBoostEvent } from '$lib/utils/analytics';
import { Link } from 'react-router-dom';
import styles from './multi-progress.module.scss';

interface ReportProgress {
	group: isaGroupKeys;
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
type MaybeLinkProps = typeof Link & {
	isLink?: boolean;
	trackEvent?: string;
	trackEventProps?: string;
};

const MaybeLink: React.FC< MaybeLinkProps > = ( {
	isLink = true,
	trackEvent = '',
	trackEventProps = '',
	children,
	...rest
} ) => {
	const handleClick: MouseEventHandler< HTMLAnchorElement > = () => {
		if ( trackEvent !== '' ) {
			recordBoostEvent( trackEvent, { group: trackEventProps } );
		}
	};

	if ( isLink ) {
		return (
			<Link onClick={ handleClick } { ...rest }>
				{ children }
			</Link>
		);
	}
	return <>{ children }</>;
};

const MultiProgress: React.FC< MultiProgressProps > = ( { reportProgress } ) => {
	return (
		<div className={ styles[ 'multi-progress' ] }>
			{ reportProgress.map( ( report, index ) => (
				<div key={ index } className={ styles.entry }>
					<div className={ styles.progress }>
						<ProgressBar progress={ report.progress } />
					</div>

					{ report.progress > 0 && report.progress < 100 ? (
						<Spinner />
					) : (
						<MaybeLink
							isLink={ report.has_issues }
							className="jb-navigator-link"
							to={ `/image-size-analysis/${ report.group }/1` }
							trackEvent="clicked_isa_group_on_report_page"
							trackEventProps={ report.group }
						>
							<span
								className={ clsx( styles.bubble, {
									[ styles.done ]: report.done,
									[ styles[ 'has-issues' ] ]: report.has_issues,
								} ) }
							>
								{ report.has_issues ? <WarningIcon /> : report.done ? '✓' : index + 1 }
							</span>
						</MaybeLink>
					) }

					<div className={ styles.category }>
						<MaybeLink
							isLink={ report.has_issues }
							className="jb-navigator-link"
							to={ `/image-size-analysis/${ report.group }/1` }
							trackEvent="clicked_isa_group_on_report_page"
							trackEventProps={ report.group }
						>
							{ getGroupLabel( report.group ) }
						</MaybeLink>
						{ report.group === 'other' && <OtherGroupContext /> }
					</div>

					{ ( report.done || report.has_issues ) && (
						<div
							className={ clsx( styles.status, {
								[ styles[ 'has-issues' ] ]: report.has_issues,
							} ) }
						>
							<MaybeLink
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
							</MaybeLink>
						</div>
					) }
				</div>
			) ) }
		</div>
	);
};

export default MultiProgress;
