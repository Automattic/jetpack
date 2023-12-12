import { useState, useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import MultiProgress from '../multi-progress/multi-progress';
import Button from '../button/button';
import { requestImageAnalysis, ISAStatus, getSummaryProgress } from '../lib/stores/isa-summary';
import { resetIsaQuery } from '../lib/stores/isa-data';
import ErrorNotice from '$features/error-notice/error-notice';
import ImageCdnRecommendation from '$features/image-size-analysis/image-cdn-recommendation/image-cdn-recommendation';
import { recordBoostEvent, recordBoostEventAndRedirect } from '$lib/utils/analytics';
import getIsaErrorSuggestion from '$lib/utils/get-isa-error-suggestion';
import RefreshIcon from '$svg/refresh';
import WarningIcon from '$svg/warning-outline';
import type { ISASummaryGroup, ISASummary } from '../lib/stores/isa-summary';

interface RecommendationsMetaProps {
	isCdnActive: boolean;
	isaSummary: ISASummary | null;
}

const RecommendationsMeta: React.FC< RecommendationsMetaProps > = ( {
	isCdnActive,
	isaSummary,
} ) => {
	const [ requestingReport, setRequestingReport ] = useState< boolean >( false );
	const [ errorCode, setErrorCode ] = useState< number | undefined >( undefined );
	const [ status, setStatus ] = useState< string | undefined >( undefined );
	const [ groups, setGroups ] = useState< Record< string, ISASummaryGroup > >( {} );
	const [ scannedPages, setScannedPages ] = useState< number >( 0 );
	const [ totalIssues, setTotalIssues ] = useState< number >( 0 );
	const [ errorMessage, setErrorMessage ] = useState< string | undefined >( undefined );
	const [ errorSuggestion, setErrorSuggestion ] = useState< string | undefined >( undefined );
	const [ waitNotice, setWaitNotice ] = useState< string | undefined >( undefined );
	const [ showCDNRecommendation, setShowCDNRecommendation ] = useState< boolean >( false );

	useEffect( () => {
		setStatus( isaSummary?.status );
		setGroups( isaSummary?.groups || {} );
		setScannedPages( scannedPagesCount( isaSummary?.groups || {} ) );
		/**
		 * Calculate total number of issues.
		 */
		setTotalIssues(
			Object.values( isaSummary?.groups || {} ).reduce(
				( total, group ) => total + group.issue_count,
				0
			)
		);
		/**
		 * Work out if there is an error to show in the UI.
		 */
		setErrorMessage( getErrorMessage( undefined, status ) );
		/**
		 * Update suggestion based on error code.
		 */
		setErrorSuggestion( getIsaErrorSuggestion( errorCode ) );
		/**
		 * Work out whether we have a 'give us a minute' notice to show.
		 */
		setWaitNotice( getWaitNotice( requestingReport, status ) );
		setShowCDNRecommendation(
			! isCdnActive && ( totalIssues > 0 || status === ISAStatus.NotFound )
		);
	}, [ isCdnActive, isaSummary, errorCode, requestingReport, status, totalIssues ] );

	const scannedPagesCount = ( isaGroups: Record< string, ISASummaryGroup > ) => {
		return Object.values( isaGroups )
			.map( group => group.scanned_pages )
			.reduce( ( a, b ) => a + b, 0 );
	};

	const getErrorMessage = ( error: string | undefined, currentStatus: string | undefined ) => {
		return (
			error ||
			( currentStatus === ISAStatus.Stuck &&
				__(
					'Your Image Size Analysis task seems to have gotten stuck, or our system is under unusual load. Please try again. If the issue persists, please contact support.',
					'jetpack-boost'
				) )
		);
	};

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

	/**
	 * Start a new image analysis job.
	 */
	const startAnalysis = async () => {
		try {
			setErrorCode( undefined );
			setErrorMessage( undefined );
			setRequestingReport( true );
			await requestImageAnalysis();
			resetIsaQuery();
		} catch ( err ) {
			setErrorCode( err.body?.code );
			setErrorMessage( err.message );
		} finally {
			setRequestingReport( false );
		}
	};

	const handleAnalyzeClick = () => {
		const eventName =
			status === ISAStatus.Completed
				? 'clicked_restart_isa_on_summary_page'
				: 'clicked_start_isa_on_summary_page';
		recordBoostEvent( eventName, {} );
		return startAnalysis();
	};

	return (
		<div>
			{ ! groups ? (
				<div className="jb-summary">{ __( 'Loading…', 'jetpack-boost' ) }</div>
			) : (
				<>
					{ errorMessage ? (
						<div className="jb-error-area">
							<ErrorNotice
								title={ __( 'Something has gone wrong.', 'jetpack-boost' ) }
								suggestion={ errorSuggestion }
								error={ errorMessage }
							/>
						</div>
					) : waitNotice ? (
						<div className="jb-summary-line jb-wait-notice">{ waitNotice }</div>
					) : null }

					{ ! requestingReport && status === ISAStatus.Completed && (
						<div className="jb-summary-line">
							{ totalIssues > 0 ? (
								<div className="jb-has-issues jb-summary">
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
								<div className="jb-summary">
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
							<button
								type="button"
								className="components-button is-link"
								onClick={ handleAnalyzeClick }
								disabled={ requestingReport }
							>
								<RefreshIcon />
								{ __( 'Analyze again', 'jetpack-boost' ) }
							</button>
						</div>
					) }

					{ ! requestingReport && [ ISAStatus.Completed, ISAStatus.Queued ].includes( status ) && (
						<MultiProgress summaryProgress={ getSummaryProgress( groups ) } />
					) }

					{ showCDNRecommendation && (
						<div className="jb-notice">
							<div className="jb-notice__content">
								<ImageCdnRecommendation />
							</div>
						</div>
					) }

					{ [ ISAStatus.Queued, ISAStatus.Completed ].includes( status ) && ! requestingReport && (
						<div className="jb-button-area">
							<Button
								disabled={ requestingReport }
								onClick={ () =>
									recordBoostEventAndRedirect(
										'#image-size-analysis/all/1',
										'clicked_view_isa_report_on_summary_page',
										{}
									)
								}
							>
								{ status === ISAStatus.Completed
									? __( 'See full report', 'jetpack-boost' )
									: __( 'View report in progress', 'jetpack-boost' ) }
							</Button>
						</div>
					) }

					{ ! [ ISAStatus.New, ISAStatus.Queued, ISAStatus.Completed ].includes( status ) && (
						<div className="jb-button-area">
							<Button disabled={ requestingReport } onClick={ handleAnalyzeClick }>
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
