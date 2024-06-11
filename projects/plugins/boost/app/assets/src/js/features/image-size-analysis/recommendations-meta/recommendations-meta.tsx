import { __, sprintf } from '@wordpress/i18n';
import MultiProgress from '../multi-progress/multi-progress';
import { Button } from '@automattic/jetpack-components';
import ErrorNotice from '$features/error-notice/error-notice';
import ImageCdnRecommendation from '$features/image-size-analysis/image-cdn-recommendation/image-cdn-recommendation';
import { recordBoostEvent, recordBoostEventAndRedirect } from '$lib/utils/analytics';
import RefreshIcon from '$svg/refresh';
import WarningIcon from '$svg/warning-outline';

import {
	ISAStatus,
	getReportProgress,
	useIsaReport,
	useImageAnalysisRequest,
	IsaCounts,
} from '$features/image-size-analysis';
import clsx from 'clsx';
import styles from './recommendations-meta.module.scss';

const getWaitNotice = ( isRequesting: boolean, currentStatus: string | undefined ) => {
	if ( isRequesting ) {
		return __( 'Getting ready…', 'jetpack-boost' );
	}
	if ( currentStatus === ISAStatus.New ) {
		return __( 'Warming up the engine…', 'jetpack-boost' );
	}
	if ( currentStatus === ISAStatus.Queued ) {
		return __( 'Give us a few minutes while we go through your images…', 'jetpack-boost' );
	}
	return undefined;
};

interface Props {
	isCdnActive: boolean;
}

const RecommendationsMeta: React.FC< Props > = ( { isCdnActive } ) => {
	const [ { data: isaReport } ] = useIsaReport();
	const isaRequest = useImageAnalysisRequest();

	const status = isaReport?.status;
	const groups = isaReport?.groups || {};

	const totalIssues = Object.entries( groups ).reduce( ( total, [ , group ] ) => {
		const groupWithIssueCount = group as { issue_count: number };

		return total + groupWithIssueCount.issue_count;
	}, 0 );

	const scannedPages = Object.values< IsaCounts >( groups )
		.map( group => group.scanned_pages )
		.reduce( ( a, b ) => a + b, 0 );

	const waitNotice = getWaitNotice( isaRequest.isPending, status );
	const showCDNRecommendation =
		! isCdnActive && ( totalIssues > 0 || status === ISAStatus.NotFound );

	const handleAnalyzeClick = () => {
		const eventName =
			status === ISAStatus.Completed
				? 'clicked_restart_isa_on_report_page'
				: 'clicked_start_isa_on_report_page';
		recordBoostEvent( eventName, {} );
		isaRequest.requestNewReport();
	};
	return (
		<div>
			{ ! groups ? (
				<div className={ styles.summary }>{ __( 'Loading…', 'jetpack-boost' ) }</div>
			) : (
				<>
					{ status === ISAStatus.Stuck || isaRequest.isError ? (
						<div className={ styles[ 'error-area' ] }>
							<ErrorNotice title={ __( 'Something has gone wrong.', 'jetpack-boost' ) }>
								{ isaRequest.error instanceof Error
									? isaRequest.error.message
									: __(
											'Your Image Size Analysis task seems to have gotten stuck, or our system is under unusual load. Please try again. If the issue persists, please contact support.',
											'jetpack-boost'
									  ) }
							</ErrorNotice>
						</div>
					) : waitNotice ? (
						<div className={ clsx( styles[ 'summary-line' ], styles[ 'wait-notice' ] ) }>
							{ waitNotice }
						</div>
					) : null }

					{ ! isaRequest.isPending && status === ISAStatus.Completed && (
						<div className={ styles[ 'summary-line' ] }>
							{ totalIssues > 0 ? (
								<div className={ clsx( styles[ 'has-issues' ], styles.summary ) }>
									<WarningIcon />
									{ sprintf(
										// translators: 1: Number of scanned issues found 2: Number of scanned pages
										__(
											'Found a total of %1$d issues after scanning your %2$d most recent pages.',
											'jetpack-boost'
										),
										totalIssues,
										scannedPages
									) }
								</div>
							) : (
								<div className={ styles.summary }>
									{ sprintf(
										// translators: %d: Number of pages scanned
										__(
											'Congratulations; no issues found after scanning your %d most recent pages.',
											'jetpack-boost'
										),
										scannedPages
									) }
								</div>
							) }
							<Button
								variant="link"
								size="small"
								weight="regular"
								icon={ <RefreshIcon /> }
								onClick={ handleAnalyzeClick }
								disabled={ isaRequest.isPending }
							>
								{ __( 'Analyze again', 'jetpack-boost' ) }
							</Button>
						</div>
					) }

					{ ! isaRequest.isPending &&
						status &&
						[ ISAStatus.Completed, ISAStatus.Queued ].includes( status ) && (
							<MultiProgress reportProgress={ getReportProgress( groups ) } />
						) }

					{ showCDNRecommendation && (
						<div className={ styles.notice }>
							<div>
								<ImageCdnRecommendation />
							</div>
						</div>
					) }

					{ status &&
						[ ISAStatus.Queued, ISAStatus.Completed ].includes( status ) &&
						! isaRequest.isPending && (
							<div className={ styles[ 'button-area' ] }>
								<Button
									variant="secondary"
									disabled={ isaRequest.isPending }
									onClick={ () =>
										recordBoostEventAndRedirect(
											'#image-size-analysis/all/1',
											'clicked_view_isa_report_on_report_page',
											{}
										)
									}
								>
									{ ( status as ISAStatus ) === ISAStatus.Completed
										? __( 'See full report', 'jetpack-boost' )
										: __( 'View report in progress', 'jetpack-boost' ) }
								</Button>
							</div>
						) }

					{ ( ! status ||
						! [ ISAStatus.New, ISAStatus.Queued, ISAStatus.Completed ].includes( status ) ) && (
						<div className={ styles[ 'button-area' ] }>
							<Button
								variant="secondary"
								disabled={ isaRequest.isPending }
								onClick={ handleAnalyzeClick }
							>
								{ status === ISAStatus.Completed
									? __( 'Analyze again', 'jetpack-boost' )
									: __( 'Start image analysis', 'jetpack-boost' ) }
							</Button>
						</div>
					) }
				</>
			) }
		</div>
	);
};

export default RecommendationsMeta;
