import { jest } from '@jest/globals';

/**
 * Creates a chainable jqXHR-like mock for jQuery.post whose done/fail
 * callbacks can be triggered from the test.
 *
 * @return {object} The mock with `jqXhr`, `resolve` and `reject` helpers.
 */
function makePostMock() {
	const callbacks = {};
	const jqXhr = {
		done: fn => {
			callbacks.done = fn;
			return jqXhr;
		},
		fail: fn => {
			callbacks.fail = fn;
			return jqXhr;
		},
	};

	return {
		jqXhr,
		resolve: response => callbacks.done( response ),
		reject: () => callbacks.fail(),
	};
}

describe( 'videopress-media-new', () => {
	let fileFilter;
	let readyCallback;
	let postMock;
	let uploader;
	let stockUploadSuccess;
	let stockAddFileMock;

	/**
	 * Loads the script fresh with mocked globals and captures the plupload
	 * file filter and the jQuery ready callback it registers.
	 */
	function loadScript() {
		postMock = makePostMock();

		global.plupload = {
			HTTP_ERROR: 'HTTP_ERROR',
			FILE_SIZE_ERROR: 'FILE_SIZE_ERROR',
			addFileFilter: jest.fn( ( name, fn ) => {
				fileFilter = fn;
			} ),
			parseSize: size => parseInt( size, 10 ),
			translate: string => string,
		};

		const jQueryMock = jest.fn( fn => {
			readyCallback = fn;
		} );
		jQueryMock.post = () => {};
		jest.spyOn( jQueryMock, 'post' ).mockImplementation( () => postMock.jqXhr );
		global.jQuery = jQueryMock;

		global.ajaxurl = 'admin-ajax.php';
		global.pluploadL10n = {
			default_error: 'An error occurred in the upload.',
			file_exceeds_size_limit: '%s exceeds the maximum upload size.',
		};

		jest.isolateModules( () => {
			require( '../videopress-media-new' );
		} );
	}

	/**
	 * Runs the captured ready callback with a mocked global uploader and
	 * stock upload handlers in place.
	 */
	function runReadyCallback() {
		global.wpUploaderInit = {};

		uploader = {
			addFile: jest.fn(),
			bind: jest.fn(),
			getOption: jest.fn(
				option =>
					( {
						url: 'async-upload.php',
						file_data_name: 'async-upload',
						headers: undefined,
					} )[ option ]
			),
			setOption: jest.fn(),
		};
		stockAddFileMock = uploader.addFile;
		window.uploader = uploader;

		stockUploadSuccess = jest.fn();
		window.uploadSuccess = stockUploadSuccess;
		window.wpFileError = () => {};
		jest.spyOn( window, 'wpFileError' ).mockImplementation();

		readyCallback();
	}

	/**
	 * Returns the handlers bound to the given uploader event.
	 *
	 * @param {string} event - The plupload event name.
	 * @return {Function[]} The bound handlers.
	 */
	function boundHandlers( event ) {
		return uploader.bind.mock.calls.filter( call => call[ 0 ] === event ).map( call => call[ 1 ] );
	}

	beforeEach( () => {
		fileFilter = undefined;
		readyCallback = undefined;
		loadScript();
	} );

	afterEach( () => {
		document.body.innerHTML = '';
		delete global.plupload;
		delete global.jQuery;
		delete global.ajaxurl;
		delete global.pluploadL10n;
		delete global.wpUploaderInit;
		delete global.videoPressMediaNew;
		delete window.uploader;
		delete window.uploadSuccess;
		delete window.wpFileError;
		delete window.wpQueueError;
	} );

	/**
	 * Sets the localized upload limit data and a spied wpQueueError global.
	 *
	 * @param {object} limits - The videoPressMediaNew payload.
	 */
	function setUploadLimits( limits ) {
		global.videoPressMediaNew = {
			strings: {
				usedVideoUpload: 'Free video upload used. <a href="checkout">Upgrade now</a>',
				multipleVideos: 'One video on the free plan. <a href="checkout">Upgrade now</a>',
				multipleVideosSelected:
					'Multiple videos need a paid plan. <a href="checkout">Upgrade now</a>',
			},
			...limits,
		};
		window.wpQueueError = () => {};
		jest.spyOn( window, 'wpQueueError' ).mockImplementation();
	}

	/**
	 * Accepts a video file through the filter, resolving the token request.
	 *
	 * @param {object} file - The plupload file object.
	 * @return {Function} The filter continuation callback mock.
	 */
	function acceptVideoThroughFilter( file ) {
		const cb = jest.fn();
		fileFilter.call( { trigger: jest.fn() }, '100b', file, cb );
		postMock.resolve( { success: true, data: { upload_action_url: 'url', upload_token: 't' } } );
		return cb;
	}

	it( 'bails when plupload is not on the page', () => {
		delete global.plupload;
		const jQueryMock = jest.fn();
		jQueryMock.post = () => {};
		jest.spyOn( jQueryMock, 'post' ).mockImplementation();
		global.jQuery = jQueryMock;

		jest.isolateModules( () => {
			require( '../videopress-media-new' );
		} );

		expect( jQueryMock ).not.toHaveBeenCalled();
	} );

	describe( 'videopress_check_uploads file filter', () => {
		it( 'is registered', () => {
			expect( global.plupload.addFileFilter ).toHaveBeenCalledWith(
				'videopress_check_uploads',
				expect.any( Function )
			);
		} );

		it( 'fetches an upload token for video files and accepts them', () => {
			const file = { name: 'movie.mp4', type: 'video/mp4' };
			const cb = jest.fn();

			fileFilter.call( { trigger: jest.fn() }, '100b', file, cb );

			expect( global.jQuery.post ).toHaveBeenCalledWith( 'admin-ajax.php', {
				action: 'videopress-get-upload-token',
				filename: 'movie.mp4',
			} );

			const tokenData = {
				upload_action_url: 'https://public-api.wordpress.com/rest/v1.1/sites/1234/media/new',
				upload_token: 'token',
				upload_blog_id: 1234,
			};
			postMock.resolve( { success: true, data: tokenData } );

			expect( file.videopress ).toEqual( tokenData );
			expect( cb ).toHaveBeenCalledWith( true );
		} );

		it( 'rejects video files when the token endpoint reports an error', () => {
			const file = { name: 'movie.mp4', type: 'video/mp4' };
			const cb = jest.fn();
			const context = { trigger: jest.fn() };

			fileFilter.call( context, '100b', file, cb );
			postMock.resolve( { success: false, data: { message: 'No VideoPress for you' } } );

			expect( context.trigger ).toHaveBeenCalledWith( 'Error', {
				code: 'HTTP_ERROR',
				message: 'No VideoPress for you',
				file,
			} );
			expect( cb ).toHaveBeenCalledWith( false );
		} );

		it( 'rejects video files when the token request fails', () => {
			const file = { name: 'movie.mp4', type: 'video/mp4' };
			const cb = jest.fn();
			const context = { trigger: jest.fn() };

			fileFilter.call( context, '100b', file, cb );
			postMock.reject();

			expect( context.trigger ).toHaveBeenCalledWith( 'Error', {
				code: 'HTTP_ERROR',
				message: 'Could not get the VideoPress token needed for uploading',
				file,
			} );
			expect( cb ).toHaveBeenCalledWith( false );
		} );

		it( 'rejects non-video files above the maximum size', () => {
			const file = { name: 'image.jpg', type: 'image/jpeg', size: 200 };
			const cb = jest.fn();
			const context = { trigger: jest.fn() };

			fileFilter.call( context, '100b', file, cb );

			expect( context.trigger ).toHaveBeenCalledWith( 'Error', {
				code: 'FILE_SIZE_ERROR',
				message: 'image.jpg exceeds the maximum upload size.',
				file,
			} );
			expect( cb ).toHaveBeenCalledWith( false );
			expect( global.jQuery.post ).not.toHaveBeenCalled();
		} );

		it( 'accepts non-video files within the maximum size', () => {
			const file = { name: 'image.jpg', type: 'image/jpeg', size: 50 };
			const cb = jest.fn();

			fileFilter.call( { trigger: jest.fn() }, '100b', file, cb );

			expect( cb ).toHaveBeenCalledWith( true );
			expect( global.jQuery.post ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'free plan upload limits', () => {
		it( 'rejects videos with the upgrade notice when the free video upload was used', () => {
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: true } );

			const cb = jest.fn();
			fileFilter.call( { trigger: jest.fn() }, '100b', { name: 'a.mp4', type: 'video/mp4' }, cb );

			expect( cb ).toHaveBeenCalledWith( false );
			expect( window.wpQueueError ).toHaveBeenCalledWith(
				'Free video upload used. <a href="checkout">Upgrade now</a>'
			);
			expect( global.jQuery.post ).not.toHaveBeenCalled();
		} );

		it( 'blocks every video of a multi-video selection with the upgrade notice', () => {
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: false } );
			runReadyCallback();

			const videoA = { name: 'a.mp4', type: 'video/mp4' };
			const videoB = { name: 'b.mp4', type: 'video/mp4' };
			window.uploader.addFile( [ videoA, videoB ] );

			expect( stockAddFileMock ).toHaveBeenCalledWith( [ videoA, videoB ], undefined );

			const firstCb = jest.fn();
			const secondCb = jest.fn();
			fileFilter.call( { trigger: jest.fn() }, '100b', videoA, firstCb );
			fileFilter.call( { trigger: jest.fn() }, '100b', videoB, secondCb );

			expect( firstCb ).toHaveBeenCalledWith( false );
			expect( secondCb ).toHaveBeenCalledWith( false );
			expect( window.wpQueueError ).toHaveBeenCalledWith(
				'Multiple videos need a paid plan. <a href="checkout">Upgrade now</a>'
			);
			expect( global.jQuery.post ).not.toHaveBeenCalled();
		} );

		it( 'still allows a single-video selection after a blocked multi-video selection', () => {
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: false } );
			runReadyCallback();

			window.uploader.addFile( [
				{ name: 'a.mp4', type: 'video/mp4' },
				{ name: 'b.mp4', type: 'video/mp4' },
			] );

			const single = { name: 'c.mp4', type: 'video/mp4' };
			window.uploader.addFile( [ single ] );

			const cb = acceptVideoThroughFilter( single );

			expect( cb ).toHaveBeenCalledWith( true );
		} );

		it( 'lets non-videos of a multi-video selection through', () => {
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: false } );
			runReadyCallback();

			const image = { name: 'image.jpg', type: 'image/jpeg', size: 50 };
			window.uploader.addFile( [
				image,
				{ name: 'a.mp4', type: 'video/mp4' },
				{ name: 'b.mp4', type: 'video/mp4' },
			] );

			const cb = jest.fn();
			fileFilter.call( { trigger: jest.fn() }, '100b', image, cb );

			expect( cb ).toHaveBeenCalledWith( true );
		} );

		it( 'renders the notice outside the error area the stock uploader clears', () => {
			document.body.innerHTML =
				'<div class="media-upload-form"><div id="media-upload-error"></div></div>';
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: false } );
			runReadyCallback();

			const videoA = { name: 'a.mp4', type: 'video/mp4' };
			const videoB = { name: 'b.mp4', type: 'video/mp4' };
			window.uploader.addFile( [ videoA, videoB ] );
			fileFilter.call( { trigger: jest.fn() }, '100b', videoA, jest.fn() );

			const notice = document.querySelector( '.videopress-media-new-notice' );
			expect( notice ).not.toBeNull();
			expect( notice ).toHaveTextContent( 'Multiple videos need a paid plan' );
			expect( notice.querySelector( 'a' ) ).not.toBeNull();
			expect( window.wpQueueError ).not.toHaveBeenCalled();

			// The stock FilesAdded handler empties #media-upload-error when
			// part of a selection is accepted; the notice must survive that.
			document.getElementById( 'media-upload-error' ).innerHTML = '';
			expect( document.querySelector( '.videopress-media-new-notice' ) ).not.toBeNull();
		} );

		it( 'clears the previous notice when a new selection starts', () => {
			document.body.innerHTML =
				'<div class="media-upload-form"><div id="media-upload-error"></div></div>';
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: false } );
			runReadyCallback();

			window.uploader.addFile( [
				{ name: 'a.mp4', type: 'video/mp4' },
				{ name: 'b.mp4', type: 'video/mp4' },
			] );
			fileFilter.call(
				{ trigger: jest.fn() },
				'100b',
				{ name: 'a.mp4', type: 'video/mp4' },
				jest.fn()
			);
			expect( document.querySelector( '.videopress-media-new-notice' ) ).not.toBeNull();

			window.uploader.addFile( [ { name: 'c.mp4', type: 'video/mp4' } ] );

			expect( document.querySelector( '.videopress-media-new-notice' ) ).toBeNull();
		} );

		it( 'allows multi-video selections with a VideoPress purchase', () => {
			setUploadLimits( { hasVideoPressPurchase: true, hasUsedVideo: false } );
			runReadyCallback();

			const videoA = { name: 'a.mp4', type: 'video/mp4' };
			const videoB = { name: 'b.mp4', type: 'video/mp4' };
			window.uploader.addFile( [ videoA, videoB ] );

			const firstCb = acceptVideoThroughFilter( videoA );
			const secondCb = acceptVideoThroughFilter( videoB );

			expect( firstCb ).toHaveBeenCalledWith( true );
			expect( secondCb ).toHaveBeenCalledWith( true );
			expect( window.wpQueueError ).not.toHaveBeenCalled();
		} );

		it( 'allows a single video and rejects a subsequent video selection with the upgrade notice', () => {
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: false } );

			const firstCb = acceptVideoThroughFilter( { name: 'a.mp4', type: 'video/mp4' } );
			expect( firstCb ).toHaveBeenCalledWith( true );
			expect( window.wpQueueError ).not.toHaveBeenCalled();

			const secondCb = jest.fn();
			fileFilter.call(
				{ trigger: jest.fn() },
				'100b',
				{ name: 'b.mp4', type: 'video/mp4' },
				secondCb
			);

			expect( secondCb ).toHaveBeenCalledWith( false );
			expect( window.wpQueueError ).toHaveBeenCalledWith(
				'One video on the free plan. <a href="checkout">Upgrade now</a>'
			);
			expect( global.jQuery.post ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does not consume the free video slot when the token request fails', () => {
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: false } );

			const failedCb = jest.fn();
			fileFilter.call(
				{ trigger: jest.fn() },
				'100b',
				{ name: 'a.mp4', type: 'video/mp4' },
				failedCb
			);
			postMock.reject();
			expect( failedCb ).toHaveBeenCalledWith( false );

			const retryCb = acceptVideoThroughFilter( { name: 'a.mp4', type: 'video/mp4' } );
			expect( retryCb ).toHaveBeenCalledWith( true );
			expect( window.wpQueueError ).not.toHaveBeenCalled();
		} );

		it( 'allows multiple videos with a VideoPress purchase', () => {
			setUploadLimits( { hasVideoPressPurchase: true, hasUsedVideo: true } );

			const firstCb = acceptVideoThroughFilter( { name: 'a.mp4', type: 'video/mp4' } );
			const secondCb = acceptVideoThroughFilter( { name: 'b.mp4', type: 'video/mp4' } );

			expect( firstCb ).toHaveBeenCalledWith( true );
			expect( secondCb ).toHaveBeenCalledWith( true );
			expect( window.wpQueueError ).not.toHaveBeenCalled();
		} );

		it( 'still rejects the video when the notice strings are missing', () => {
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: true, strings: {} } );

			const cb = jest.fn();
			fileFilter.call( { trigger: jest.fn() }, '100b', { name: 'a.mp4', type: 'video/mp4' }, cb );

			expect( cb ).toHaveBeenCalledWith( false );
			expect( window.wpQueueError ).not.toHaveBeenCalled();
			expect( document.querySelector( '.videopress-media-new-notice' ) ).toBeNull();
		} );

		it( 'does not restrict non-video files on the free plan', () => {
			setUploadLimits( { hasVideoPressPurchase: false, hasUsedVideo: true } );

			const cb = jest.fn();
			fileFilter.call(
				{ trigger: jest.fn() },
				'100b',
				{ name: 'image.jpg', type: 'image/jpeg', size: 50 },
				cb
			);

			expect( cb ).toHaveBeenCalledWith( true );
			expect( window.wpQueueError ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'uploader wiring', () => {
		it( 'does nothing when the classic uploader is not on the page', () => {
			readyCallback();

			expect( window.uploadSuccess ).toBeUndefined();
		} );

		it( 'binds the upload lifecycle events', () => {
			runReadyCallback();

			expect( boundHandlers( 'BeforeUpload' ) ).toHaveLength( 1 );
			expect( boundHandlers( 'Error' ) ).toHaveLength( 1 );
			expect( boundHandlers( 'UploadComplete' ) ).toHaveLength( 1 );
		} );

		it( 're-targets VideoPress files and restores stock settings afterwards', () => {
			runReadyCallback();

			const beforeUpload = boundHandlers( 'BeforeUpload' )[ 0 ];
			const file = {
				videopress: {
					upload_action_url: 'https://public-api.wordpress.com/rest/v1.1/sites/1234/media/new',
					upload_token: 'token',
					upload_blog_id: 1234,
				},
			};

			beforeUpload( uploader, file );

			expect( uploader.setOption ).toHaveBeenCalledWith( 'url', file.videopress.upload_action_url );
			expect( uploader.setOption ).toHaveBeenCalledWith( 'file_data_name', 'media[]' );
			expect( uploader.setOption ).toHaveBeenCalledWith( 'headers', {
				Authorization: 'X_UPLOAD_TOKEN token="token" blog_id="1234"',
			} );

			uploader.setOption.mockClear();

			// A later non-VideoPress file in the batch gets the stock settings back.
			beforeUpload( uploader, {} );

			expect( uploader.setOption ).toHaveBeenCalledWith( 'url', 'async-upload.php' );
			expect( uploader.setOption ).toHaveBeenCalledWith( 'file_data_name', 'async-upload' );
			expect( uploader.setOption ).toHaveBeenCalledWith( 'headers', undefined );
		} );

		it( 'leaves the stock settings alone for non-VideoPress files', () => {
			runReadyCallback();

			boundHandlers( 'BeforeUpload' )[ 0 ]( uploader, {} );

			expect( uploader.setOption ).not.toHaveBeenCalled();
		} );

		it( 'restores stock settings when an upload batch completes', () => {
			runReadyCallback();

			boundHandlers( 'BeforeUpload' )[ 0 ]( uploader, { videopress: { upload_token: 't' } } );
			uploader.setOption.mockClear();

			boundHandlers( 'UploadComplete' )[ 0 ]( uploader );

			expect( uploader.setOption ).toHaveBeenCalledWith( 'url', 'async-upload.php' );
		} );

		it( 'restores stock settings when an upload errors', () => {
			runReadyCallback();

			boundHandlers( 'BeforeUpload' )[ 0 ]( uploader, { videopress: { upload_token: 't' } } );
			uploader.setOption.mockClear();

			boundHandlers( 'Error' )[ 0 ]( uploader );

			expect( uploader.setOption ).toHaveBeenCalledWith( 'url', 'async-upload.php' );
		} );
	} );

	describe( 'uploadSuccess wrapper', () => {
		it( 'passes non-VideoPress uploads through untouched', () => {
			runReadyCallback();

			const file = { name: 'image.jpg' };
			window.uploadSuccess( file, '42' );

			expect( stockUploadSuccess ).toHaveBeenCalledWith( file, '42' );
		} );

		it( 'hands the attachment ID from the REST response to the stock handler', () => {
			runReadyCallback();

			const file = { videopress: { upload_token: 't' } };
			window.uploadSuccess( file, JSON.stringify( { media: [ { ID: 123 } ] } ) );

			expect( stockUploadSuccess ).toHaveBeenCalledWith( file, '123' );
		} );

		it( 'reports an error when the response is not valid JSON', () => {
			runReadyCallback();

			const file = { videopress: { upload_token: 't' } };
			window.uploadSuccess( file, 'this is not JSON' );

			expect( stockUploadSuccess ).not.toHaveBeenCalled();
			expect( window.wpFileError ).toHaveBeenCalledWith( file, 'An error occurred in the upload.' );
		} );

		it( 'reports the API error message when the response has no media', () => {
			runReadyCallback();

			const file = { videopress: { upload_token: 't' } };
			window.uploadSuccess( file, JSON.stringify( { message: 'Upload rejected' } ) );

			expect( stockUploadSuccess ).not.toHaveBeenCalled();
			expect( window.wpFileError ).toHaveBeenCalledWith( file, 'Upload rejected' );
		} );
	} );
} );
