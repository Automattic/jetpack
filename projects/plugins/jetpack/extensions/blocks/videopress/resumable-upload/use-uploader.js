import * as tus from 'tus-js-client';

export const getJWT = function () {
	// eslint-disable-next-line no-undef
	return new Promise( function ( resolve, reject ) {
		wp.media
			.ajax( 'videopress-get-upload-jwt', { async: true } )
			.done( function ( response ) {
                console.log( 'RESPONSE!', response );
				resolve( {
					token: response.upload_token,
					blogId: response.upload_blog_id,
					url: response.upload_action_url,
				} );
			} ).fail( function ( reason ) { reject( reason );
			} );
	} );
};

var jwtsForKeys = {}; // TODO seems unecessary

export const useUploader = ( {
	onError,
	onProgress,
	onSuccess,
} ) => {
	return ( file, data ) => {
			const upload = new tus.Upload( file,
				{
					onError:
						onError ||
						function ( error ) {
							console.log( 'Failed because: ' + error );
						},
					onProgress:
						onProgress ||
						function ( bytesUploaded, bytesTotal ) {
							const percentage = (
								( bytesUploaded / bytesTotal ) *
								100
							).toFixed( 2 );
							console.log( bytesUploaded, bytesTotal, percentage + '%' );
						},
					onSuccess:
						onSuccess ||
						function () {
							console.log(
								'Download %s from %s',
								upload.file.name,
								upload.url
							);
						},
					endpoint: data.url,
					resume: true,
					removeFingerprintOnSuccess: true,
					withCredentials: false,
					autoRetry: true,
					overridePatchMethod: false,
					chunkSize: 500000, // 500 Kb.
					allowedFileTypes: ['video/*'],
					metadata: {
						filename: file.name,
						filetype: file.type,
					},
					retryDelays: [ 0, 1000, 3000, 5000, 10000 ],
					onAfterResponse: function ( req, res ) {
						//console.log( res._xhr.getAllResponseHeaders() );
						// Why is this not showing the x-headers?
						if ( res.getStatus() >= 400 ) {
							return;
						}

						var headerMap = {
							'x-videopress-upload-key-token': 'token',
							'x-videopress-upload-key': 'key',
							'x-videopress-upload-blog-id': 'blogId',
						};

						var data = {};
						Object.keys(headerMap).forEach( function ( header ) {
							var value = res.getHeader( header );
							if ( ! value ) {
								return;
							}

							data[headerMap[header]] = value;
						} );
						//console.log( res, data );

						if (data.key && data.token) {
							jwtsForKeys[data.key] = data.token;
						}
					},
					onBeforeRequest: function ( req ) {
						// make ALL requests be either POST or GET to honor the public-api.wordpress.com "contract".
						var method = req._method;
						if ( ['HEAD', 'OPTIONS'].indexOf(method) >= 0 ) {
							req._method = 'GET';
							req.setHeader('X-HTTP-Method-Override', method);
						}

						if ( ['DELETE', 'PUT', 'PATCH'].indexOf(method) >= 0 ) {
							req._method = 'POST';
							req.setHeader('X-HTTP-Method-Override', method);
						}

						req._xhr.open(req._method, req._url, true);
						// Set the headers again, reopening the xhr resets them.
						Object.keys(req._headers).map(function (headerName) {
							req.setHeader(headerName, req._headers[headerName]);
						});

						if ( 'POST' === method ) {
							var hasJWT = !! data.token;
							if (hasJWT) {
								req.setHeader( 'x-videopress-upload-token', data.token);
							} else {
								throw "should never happen";
							}
						}

						if ( ['OPTIONS', 'GET', 'HEAD', 'DELETE', 'PUT', 'PATCH'].indexOf(method) >= 0 ) {
							var url = new URL( req._url );
							var path = url.pathname;
							var parts = path.split( '/' );
							var maybeUploadkey = parts[parts.length-1];
							if ( jwtsForKeys[maybeUploadkey] ) {
                                console.log( 'ADDING HEADER TOKEN' );
								req.setHeader( 'x-videopress-upload-token', jwtsForKeys[maybeUploadkey] );
							}
						}

						return req;
					},
				} )

            upload.findPreviousUploads().then( function ( previousUploads ) {
                if ( previousUploads.length ) {
                    upload.resumeFromPreviousUpload( previousUploads[ 0 ] );
                }
    
                console.log( 'STARTING UPLOAD' );
                upload.start();
            } );
    
            return upload;
	};
};

// The videopress uploader.
// export const VideoPressUploader = ( { endpoint, token } ) => {
// 	const [ progress, setProgress ] = useState( 0 );
// 	const [ hasDropped, setHasDropped ] = useState( false );
// 	const [ hasPaused, setHasPaused ] = useState( false );
// 	const [ file, setFile ] = useState( null );
// 	const [ tusUploader, setTusUploader ] = useState( null );
// 	const onError = () => {};

// 	const onProgress = ( bytesUploaded, bytesTotal ) => {
// 		const percentage = ( bytesUploaded / bytesTotal ) * 100;
// 		setProgress( percentage );
// 	};

// 	const onSuccess = () => {};

// 	const uploader = useUploader( {
// 		onError,
// 		onProgress,
// 		onSuccess,
// 	} );

// 	const roundedProgress = Math.round( progress );
// 	const cssWidth = { width: `${roundedProgress}%` };

// 	// Some better way to detect if upload is occuring?
// 	const isUploading = progress > 0;
// 	const hasFile = null !== file;

// 	const pauseOrResumeUpload = () => {
// 		if ( tusUploader ) {
// 			if ( hasPaused ) {
// 				tusUploader.start();
// 			} else {
// 				tusUploader.abort();
// 			}

// 			setHasPaused( ! hasPaused );
// 		}
// 	};

// 	const startUpload = () => {
// 		if ( file ) {
// 			// Set state so we can perform actions on the tus uploader (like pausing)
// 			setTusUploader( uploader( file ) );
// 		}
// 	};

// 	return (
// 		<div className="videopress-uploader">
// 			<div className="videopress-uploader__select-file">
// 				<FormFileUpload
// 					accept={ 'video/*' }
// 					onChange={ ( e ) => {
// 						console.log( e );
// 						setFile( e.target.files[ 0 ] );
// 					} }
// 					render={ ( { openFileDialog } ) => {
// 						return (
// 							<Button
// 								isSecondary
// 								onClick={ () => {
// 									openFileDialog();
// 								} }
// 								disabled = { isUploading }
// 							>
// 								{ hasFile ? 'Change file' : 'Select file' }
// 							</Button>
// 						);
// 					} }
// 				/>
// 				<div className="videopress-uploader__select-file-name">
// 					{ file && file.name }
// 				</div>
// 			</div>
// 			<DropZone
// 				onFilesDrop={ () => setHasDropped( true ) }
// 				onHTMLDrop={ () => setHasDropped( true ) }
// 				onDrop={ () => setHasDropped( true ) }
// 			/>
// 			<Button
// 				className="videopress-uploader__upload-button"
// 				variant="primary"
// 				onClick={ () => startUpload() }
// 				disabled={ ! hasFile || isUploading }
// 			>
// 				Upload
// 			</Button>
// 			{ progress > 0 && (
// 				<div className="videopress-uploader__status">
// 					<div className="videopress-uploader__progress">
// 						<div className="videopress-uploader__progress-loaded" style={ cssWidth } />
// 					</div>
// 					<div className="videopress-uploader__actions">
// 							<div className="videopress-upload__percent-complete">{ `${roundedProgress}%` }</div>
// 							<Button
// 								isLink
// 								onClick={ () => pauseOrResumeUpload() }>
// 									{ hasPaused ? 'Resume' : 'Pause' }
// 							</Button>
// 						</div>
// 				</div>
// 			) }
// 		</div>
// 	);
// };

// window.VideoPressUploader = VideoPressUploader;
