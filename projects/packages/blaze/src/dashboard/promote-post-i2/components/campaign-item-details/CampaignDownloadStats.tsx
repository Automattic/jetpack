import { __ } from '@wordpress/i18n';
import { Button, Spinner } from '@wordpress/ui';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { guessTimezone } from '../../../compat/utils';
import { CampaignReportRequestBody } from '../../../data/promote-post/types';
import useCampaignReportDataQuery from '../../../data/promote-post/use-promote-post-campaign-report-data-query';
import useCampaignReportStatusQuery from '../../../data/promote-post/use-promote-post-campaign-report-status-query';
import { CampaignResponse } from '../../../data/promote-post/use-promote-post-campaigns-query';
import useRequestCampaignReportMutation from '../../../data/promote-post/use-promote-post-request-campaign-report-mutation';
import { cvsStatsDownload } from '../../utils';

interface Props {
	siteId: number;
	campaign: CampaignResponse;
	isLoading?: boolean;
	setStatsError: () => void;
}

const FlexibleSkeleton = () => {
	return <div className="campaign-item-details__flexible-skeleton" />;
};

/**
 *
 * @param props
 */
export default function CampaignDownloadStats( props: Props ) {
	const { campaign, isLoading, siteId, setStatsError } = props;
	const campaignId = campaign?.campaign_id;

	const defaultDownloadOptions: CampaignReportRequestBody = {
		start_date: campaign?.start_date || '',
		end_date: campaign?.end_date || '',
		tz: guessTimezone() || 'UTC',
	};

	const [ downloadOptions, setDownloadOptions ] =
		useState< CampaignReportRequestBody >( defaultDownloadOptions );
	const [ isStatsDownloading, setIsStatsDownloading ] = useState< boolean >( false );

	const [ reportId, setReportId ] = useState( '' );
	const [ shouldFetchReportStatus, setShouldFetchReportStatus ] = useState( false );
	const [ shouldFetchReportData, setShouldFetchReportData ] = useState( false );
	const [ reportFilename, setReportFilename ] = useState( '' );

	// 1 RequestCampaignReport
	const { requestCampaignReport } = useRequestCampaignReportMutation( () => {
		setStatsError();
		setIsStatsDownloading( false );
	} );

	// 2 GetCampaignReportStatus
	const { data: reportStatus } = useCampaignReportStatusQuery(
		siteId,
		campaignId,
		reportId,
		shouldFetchReportStatus,
		{
			enabled: shouldFetchReportStatus,
		}
	);

	// 3 GetCampaignReport
	const { data: reportData } = useCampaignReportDataQuery(
		siteId,
		campaignId,
		reportId,
		shouldFetchReportData,
		{
			enabled: shouldFetchReportData,
		}
	);

	useEffect( () => {
		if ( ! campaign?.start_date || ! campaign?.end_date ) {
			return;
		}

		const startDate = moment( campaign.start_date ).format( 'YYYY-MM-DD' ).toString();
		let endDate = moment( campaign.end_date ).format( 'YYYY-MM-DD' ).toString();

		if ( endDate < startDate ) {
			endDate = moment().format( 'YYYY-MM-DD' ).toString();
		}
		setDownloadOptions( prev => ( {
			...prev,
			start_date: startDate,
			end_date: endDate,
		} ) );
		setReportFilename( `blaze_report_${ startDate }_${ endDate }.csv` );
	}, [ campaign ] );

	const downloadStatsInit = async () => {
		// gets triggered when the download data button is clicked
		if ( ! siteId || ! campaignId ) {
			setStatsError();
			return;
		}
		setIsStatsDownloading( true );
		try {
			// call to DSP RequestCampaignReport
			const result = await requestCampaignReport( siteId, campaignId, downloadOptions );
			if ( result?.report_id ) {
				setReportId( result.report_id ); // Save the report ID for fetching status
				setShouldFetchReportStatus( true );
			} else {
				setStatsError();
				setIsStatsDownloading( false );
			}
		} catch {
			setStatsError();
			setIsStatsDownloading( false );
		}
	};

	useEffect( () => {
		// Effect triggered when `reportStatus` updates
		let timer: ReturnType< typeof setTimeout >;
		if ( reportStatus ) {
			setShouldFetchReportStatus( false );
			if ( reportStatus.status === 'completed' ) {
				// Trigger fetching the report data object when completed
				setShouldFetchReportData( true );
			} else if ( reportStatus.status === 'failed' ) {
				setStatsError();
				setIsStatsDownloading( false );
			} else if ( [ 'active', 'waiting', 'delayed' ].includes( reportStatus.status ) ) {
				// will retrigger the status fetch after 1.2 sec
				timer = setTimeout( () => setShouldFetchReportStatus( true ), 1200 );
			}
		}
		return () => clearTimeout( timer ); // Cleanup timer on unmount
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Reacts only to the report status changing, as the Calypso original did.
	}, [ reportStatus ] );

	useEffect( () => {
		// Effect triggered when `reportData` updates
		if ( reportData ) {
			setIsStatsDownloading( false );
			setShouldFetchReportData( false );
			cvsStatsDownload( reportData, reportFilename );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Reacts only to the report status changing, as the Calypso original did.
	}, [ reportData ] );

	useEffect( () => {
		// Reset state when the user clicks the button again
		if ( ! isStatsDownloading && reportId ) {
			setReportId( '' );
			setShouldFetchReportStatus( false );
			setShouldFetchReportData( false );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Reacts only to the report status changing, as the Calypso original did.
	}, [ isStatsDownloading ] );

	return (
		<>
			{ ! isLoading ? (
				<>
					{ isStatsDownloading ? (
						<div className="stats-downloading">
							<Spinner />
							<span>{ __( 'Generating report', 'jetpack-blaze' ) }</span>
						</div>
					) : (
						<Button
							variant="outline"
							className="campaign-item-details__download-stats-button"
							onClick={ () => {
								downloadStatsInit();
							} }
						>
							{ __( 'Download data', 'jetpack-blaze' ) }
						</Button>
					) }
				</>
			) : (
				<FlexibleSkeleton />
			) }
		</>
	);
}
