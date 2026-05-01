/* eslint-disable jsdoc/require-jsdoc */

import { Button, Card, CardBody, CardHeader, Icon, Notice } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { rotateLeft, arrowLeft } from '@wordpress/icons';
import { useNavigate, useSearchParams } from 'react-router';
import { useFormattedTime } from '../../data/use-formatted-time';
import { JetpackBackupRoutes } from '../../routes';
import RestoreError from './error';
import RestoreForm from './form';
import RestoreProgress from './progress';
import styles from './style.module.scss';
import RestoreSuccess from './success';

type RestoreStep = 'form' | 'progress' | 'success' | 'error';

function RestoreScreen() {
	const navigate = useNavigate();
	const [ searchParams, setSearchParams ] = useSearchParams();
	const rewindId = searchParams.get( 'rewindId' ) ?? '';
	const restoreIdParam = searchParams.get( 'restoreId' );

	// When the Overview navigates here with a restoreId in the URL (the
	// granular-restore path kicked off in backup-details.tsx), jump
	// straight to the progress step. Otherwise start on the form.
	const initialRestoreId = restoreIdParam ? Number( restoreIdParam ) : null;
	const [ currentStep, setCurrentStep ] = useState< RestoreStep >(
		initialRestoreId ? 'progress' : 'form'
	);
	const [ restoreId, setRestoreId ] = useState< number | null >( initialRestoreId );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );
	const [ failureReason, setFailureReason ] = useState< string | undefined >();

	// Clean up the restoreId query param once we've captured it — otherwise
	// reloading the success page would spin up a fresh progress poll.
	useEffect( () => {
		if ( restoreIdParam ) {
			setSearchParams(
				prev => {
					const next = new URLSearchParams( prev );
					next.delete( 'restoreId' );
					return next;
				},
				{ replace: true }
			);
		}
	}, [ restoreIdParam, setSearchParams ] );

	const handleRestoreInitiate = useCallback( ( newRestoreId: number ) => {
		setCurrentStep( 'progress' );
		setRestoreId( newRestoreId );
	}, [] );

	const handleRestoreComplete = useCallback( () => {
		setCurrentStep( 'success' );
	}, [] );

	const handleRestoreError = useCallback( ( reason?: string ) => {
		setFailureReason( reason );
		setCurrentStep( 'error' );
	}, [] );

	const handleRetry = useCallback( () => {
		setCurrentStep( 'form' );
		setRestoreId( null );
		setErrorMessage( null );
		setFailureReason( undefined );
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

	const restorePointDate = useFormattedTime(
		rewindId ? new Date( parseFloat( rewindId ) * 1000 ).toISOString() : '',
		{ dateStyle: 'medium', timeStyle: 'short' }
	);

	const renderStep = () => {
		switch ( currentStep ) {
			case 'form':
				return (
					<RestoreForm
						rewindId={ rewindId }
						onRestoreInitiate={ handleRestoreInitiate }
						onError={ handleFormError }
					/>
				);
			case 'progress':
				return restoreId ? (
					<RestoreProgress
						restoreId={ restoreId }
						onRestoreComplete={ handleRestoreComplete }
						onRestoreError={ handleRestoreError }
					/>
				) : null;
			case 'success':
				return <RestoreSuccess restorePointDate={ restorePointDate } />;
			case 'error':
				return <RestoreError reason={ failureReason } onRetry={ handleRetry } />;
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
							<Icon icon={ rotateLeft } />
							<div>
								<strong>{ __( 'Restore backup', 'jetpack-backup-pkg' ) }</strong>
								{ restorePointDate && (
									<div className={ styles.headerSubtitle }>
										{ sprintf(
											/* translators: %s is the date of the restore point */
											__( 'Restore point: %s', 'jetpack-backup-pkg' ),
											restorePointDate
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

export default RestoreScreen;
