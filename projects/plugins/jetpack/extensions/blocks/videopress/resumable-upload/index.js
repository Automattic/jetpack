/**
 * WordPress dependencies
 */
import { Button, ExternalLink } from '@wordpress/components';
import { useCallback, useContext, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import filesize from 'filesize';
/**
 * Internal Dependencies
 */
import { VideoPressBlockContext } from '../components';
import { getJWT, resumableUploader } from './use-uploader';
import './style.scss';

export default function ResumableUpload( { file } ) {
	const [ progress, setProgress ] = useState( 0 );
	const [ hasPaused, setHasPaused ] = useState( false );
	const [ tusUploader, setTusUploader ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ currentUploadKey, setCurrentUploadKey ] = useState( null );
	const { onUploadFinished } = useContext( VideoPressBlockContext );
	const tusUploaderRef = useRef( null );

	tusUploaderRef.current = tusUploader;

	const startUpload = useCallback( () => {
		const onError = uploadError => {
			setError( uploadError );
		};

		const onProgress = ( bytesUploaded, bytesTotal ) => {
			const percentage = ( bytesUploaded / bytesTotal ) * 100;
			setProgress( percentage );
		};

		const onSuccess = args => {
			onUploadFinished( args );
		};

		const onUploadUuidRetrieved = key => {
			if ( null === currentUploadKey ) {
				setCurrentUploadKey( key );
			}
		};

		const uploader = resumableUploader( {
			onError,
			onProgress,
			onSuccess,
			onUploadUuidRetrieved,
		} );

		getJWT()
			.then( jwtData => {
				const newUploader = uploader( file, jwtData );
				setTusUploader( newUploader );
			} )
			.catch( jwtError => {
				setError( jwtError );
			} );
	}, [ file, onUploadFinished, currentUploadKey ] );

	useEffect( () => {
		// Kicks things off.
		startUpload();

		// Stop the upload when the block is removed.
		return () => {
			if ( null !== tusUploaderRef.current ) {
				tusUploaderRef.current.abort();
			}
		};
		// We need to pass a blank array here to act as 'component mount/unmount'
		// We don't want this effect to run again if `startUpload` changes.
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const roundedProgress = Math.round( progress );
	const cssWidth = { width: `${ roundedProgress }%` };

	const pauseOrResumeUpload = () => {
		if ( tusUploader ) {
			if ( hasPaused ) {
				tusUploader.start();
			} else {
				tusUploader.abort();
			}
			setHasPaused( ! hasPaused );
		}
	};

	const restartUpload = () => {
		setError( null );
		startUpload();
	};

	const fileSizeLabel = filesize( file.size );

	const getErrorMessage = () => {
		let errorMessage = __(
			'An error was encountered during the upload. Check your network connection.',
			'jetpack'
		);
		if ( typeof error === 'object' ) {
			const apiResponse = error.toString().match( /message":"([^"]+)"/ );
			// tus doesnt give us direct acces to the API response, but let's try to parse it to provide useful feedback for the user.
			if ( apiResponse && typeof apiResponse === 'object' && apiResponse.length === 2 ) {
				const apiResponseMessage = apiResponse[ 1 ];
				// Let's give this error a better message.
				if ( apiResponseMessage === 'Invalid Mime' ) {
					errorMessage = (
						<>
							{ __( 'The format of the video you uploaded is not supported.', 'jetpack' ) }
							&nbsp;
							<ExternalLink
								href="https://wordpress.com/support/videopress/recommended-video-settings/"
								target="_blank"
								rel="noreferrer"
							>
								{ __( 'Check the recommended video settings.', 'jetpack' ) }
							</ExternalLink>
						</>
					);
				} else {
					return apiResponseMessage;
				}
			}
		}
		return errorMessage;
	};

	return (
		<>
			{ null !== error ? (
				<div className="resumable-upload__error">
					<div className="resumable-upload__error-text">{ getErrorMessage() }</div>
					<Button variant="primary" onClick={ () => restartUpload() }>
						{ __( 'Try again', 'jetpack' ) }
					</Button>
					<Button
						variant="secondary"
						onClick={ () => onUploadFinished( { mediaId: null } ) }
						className="resumable-upload__error-cancel"
					>
						{ __( 'Cancel', 'jetpack' ) }
					</Button>
				</div>
			) : (
				<div className="resumable-upload__status">
					<div className="resumable-upload__progress">
						<div className="resumable-upload__progress-loaded" style={ cssWidth } />
					</div>
					<div className="resumable-upload__file-info">
						<div>
							{ /* eslint-disable */ }
							{ /* valid-sprintf doesn't understand double percent escape */ }
							{ hasPaused
								? sprintf(
										/* translators: Placeholder is an upload progress percenatage number, from 0-100. */
										__( 'Paused (%s%%)', 'jetpack' ),
										roundedProgress
								  )
								: sprintf(
										/* translators: Placeholder is an upload progress percenatage number, from 0-100. */
										__( 'Uploading (%s%%)', 'jetpack' ),
										roundedProgress
								  ) }
							{ /* eslint-enable */ }
						</div>
						<div className="resumable-upload__file-size">{ fileSizeLabel }</div>
					</div>
					<div className="resumable-upload__actions">
						<Button variant="link" onClick={ () => pauseOrResumeUpload() }>
							{ hasPaused ? 'Resume' : 'Pause' }
						</Button>
					</div>
				</div>
			) }
		</>
	);
}
