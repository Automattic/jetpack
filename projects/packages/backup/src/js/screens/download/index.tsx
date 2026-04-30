/* eslint-disable jsdoc/require-jsdoc */

import { Button, Card, CardBody, CardHeader, Icon, Notice } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { cloud, arrowLeft } from '@wordpress/icons';
import { useNavigate, useSearchParams } from 'react-router';
import { useFormattedTime } from '../../data/use-formatted-time';
import { JetpackBackupRoutes } from '../../routes';
import DownloadError from './error';
import DownloadForm from './form';
import DownloadProgress from './progress';
import styles from './style.module.scss';
import DownloadSuccess from './success';

type DownloadStep = 'form' | 'progress' | 'success' | 'error';

function DownloadScreen() {
	const navigate = useNavigate();
	const [ searchParams, setSearchParams ] = useSearchParams();
	const rewindId = searchParams.get( 'rewindId' ) ?? '';
	const downloadIdParam = searchParams.get( 'downloadId' );

	// When the Overview navigates here with a downloadId in the URL (the
	// granular-download path kicked off in backup-details.tsx), jump
	// straight to the progress step. Otherwise start on the form.
	const initialDownloadId = downloadIdParam ? Number( downloadIdParam ) : null;
	const [ currentStep, setCurrentStep ] = useState< DownloadStep >(
		initialDownloadId ? 'progress' : 'form'
	);
	const [ downloadId, setDownloadId ] = useState< number | null >( initialDownloadId );
	const [ downloadUrl, setDownloadUrl ] = useState< string | null >( null );
	const [ fileSizeBytes, setFileSizeBytes ] = useState< string | undefined >();
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );

	// Clean up the downloadId query param once we've captured it — otherwise
	// reloading the success page would spin up a fresh progress poll.
	useEffect( () => {
		if ( downloadIdParam ) {
			setSearchParams(
				prev => {
					const next = new URLSearchParams( prev );
					next.delete( 'downloadId' );
					return next;
				},
				{ replace: true }
			);
		}
	}, [ downloadIdParam, setSearchParams ] );

	const handleDownloadInitiate = useCallback( ( newDownloadId: number ) => {
		setCurrentStep( 'progress' );
		setDownloadId( newDownloadId );
	}, [] );

	const handleDownloadComplete = useCallback(
		( newDownloadUrl: string, newFileSizeBytes?: string ) => {
			setCurrentStep( 'success' );
			setDownloadUrl( newDownloadUrl );
			setFileSizeBytes( newFileSizeBytes );
		},
		[]
	);

	const handleDownloadError = useCallback( () => {
		setCurrentStep( 'error' );
	}, [] );

	const handleRetry = useCallback( () => {
		setCurrentStep( 'form' );
		setDownloadId( null );
		setDownloadUrl( null );
		setFileSizeBytes( undefined );
		setErrorMessage( null );
	}, [] );

	const handleFormError = useCallback( ( message: string ) => {
		setErrorMessage( message );
	}, [] );

	const handleDismissError = useCallback( () => {
		setErrorMessage( null );
	}, [] );

	const handleBack = useCallback( () => {
		const target = rewindId
			? `${ JetpackBackupRoutes.Overview }?rewindId=${ rewindId }`
			: JetpackBackupRoutes.Overview;
		navigate( target );
	}, [ navigate, rewindId ] );

	const downloadPointDate = useFormattedTime(
		rewindId ? new Date( parseFloat( rewindId ) * 1000 ).toISOString() : '',
		{ dateStyle: 'medium', timeStyle: 'short' }
	);

	const renderStep = () => {
		switch ( currentStep ) {
			case 'form':
				return (
					<DownloadForm
						rewindId={ rewindId }
						onDownloadInitiate={ handleDownloadInitiate }
						onError={ handleFormError }
					/>
				);
			case 'progress':
				return downloadId ? (
					<DownloadProgress
						downloadId={ downloadId }
						onDownloadComplete={ handleDownloadComplete }
						onDownloadError={ handleDownloadError }
					/>
				) : null;
			case 'success':
				return downloadUrl ? (
					<DownloadSuccess
						downloadPointDate={ downloadPointDate }
						downloadUrl={ downloadUrl }
						fileSizeBytes={ fileSizeBytes }
					/>
				) : null;
			case 'error':
				return <DownloadError onRetry={ handleRetry } />;
		}
	};

	return (
		<div className={ styles.screenOuter }>
			<div className={ styles.screen }>
				<Button variant="tertiary" icon={ arrowLeft } onClick={ handleBack }>
					{ __( 'Back to overview', 'jetpack-backup-pkg' ) }
				</Button>
				<Card>
					<CardHeader>
						<div className={ styles.header }>
							<Icon icon={ cloud } />
							<div>
								<strong>{ __( 'Download backup', 'jetpack-backup-pkg' ) }</strong>
								{ downloadPointDate && (
									<div className={ styles.headerSubtitle }>
										{ sprintf(
											/* translators: %s is the date of the download point */
											__( 'Download point: %s', 'jetpack-backup-pkg' ),
											downloadPointDate
										) }
									</div>
								) }
							</div>
						</div>
					</CardHeader>
					<CardBody>
						{ errorMessage && (
							<Notice status="error" onRemove={ handleDismissError }>
								{ errorMessage }
							</Notice>
						) }
						{ renderStep() }
					</CardBody>
				</Card>
			</div>
		</div>
	);
}

export default DownloadScreen;
