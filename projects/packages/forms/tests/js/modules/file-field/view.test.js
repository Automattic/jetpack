import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

// Mock WordPress Interactivity API
const mockStore = jest.fn();
const mockGetContext = jest.fn();
const mockGetConfig = jest.fn();
const mockGetElement = jest.fn();
const mockWithScope = jest.fn( callback => callback );

await jest.unstable_mockModule( '@wordpress/interactivity', () => ( {
	store: mockStore,
	getContext: mockGetContext,
	getConfig: mockGetConfig,
	getElement: mockGetElement,
	withScope: mockWithScope,
} ) );

const ALLOWED_MIME_TYPES = [ 'image/png', 'application/pdf' ];

describe( 'File Field View', () => {
	let mockContext;
	let mockElement;
	let storeConfig;
	let storeNamespace;
	let mockUpdateField;
	let mockTrackFirstInteraction;
	let state;

	beforeEach( async () => {
		jest.clearAllMocks();
		jest.resetModules();

		document.body.innerHTML = `
			<div class="jetpack-form-file-field__container" id="test-file">
				<div class="jetpack-form-file-field__dropzone">
					<div class="jetpack-form-file-field__dropzone-inner" tabindex="0" role="button"></div>
					<input type="file" class="jetpack-form-file-field" />
				</div>
				<div class="jetpack-form-file-field__preview-wrap"></div>
			</div>
		`;

		// The context a file field sees: `fieldId` and `fieldExtra` come from the wrapper that
		// render_field() opens, `files` and `isDropping` from the file field's own nested context.
		mockContext = {
			fieldId: 'test-file',
			fieldType: 'file',
			fieldExtra: {
				maxFiles: 1,
				allowedMimeTypes: ALLOWED_MIME_TYPES,
			},
			files: [],
			isDropping: false,
		};

		mockElement = {
			ref: document.querySelector( '.jetpack-form-file-field__dropzone-inner' ),
		};

		mockGetContext.mockReturnValue( mockContext );
		mockGetElement.mockReturnValue( mockElement );
		mockGetConfig.mockReturnValue( {
			endpoint: 'https://example.test/upload',
			iconsPath: 'https://example.test/icons/',
			maxUploadSize: 1024,
			i18n: {
				zeroBytes: '0 Bytes',
				fileSizeUnits: [ 'B', 'KB', 'MB', 'GB' ],
				fileTooLarge: 'File is too large.',
				invalidType: 'This file type is not allowed.',
				maxFiles: 'Too many files.',
				uploadFailed: 'File upload failed, try again.',
			},
		} );

		// `updateField` and `trackFirstInteraction` are contributed by the form module. Because the
		// file field now shares that store, it reaches them through the same `actions` object.
		mockUpdateField = jest.fn();
		mockTrackFirstInteraction = jest.fn();

		mockStore.mockImplementation( ( namespace, config ) => {
			storeNamespace = namespace;
			storeConfig = config;
			return {
				state: config.state,
				actions: {
					...config.actions,
					updateField: mockUpdateField,
					trackFirstInteraction: mockTrackFirstInteraction,
				},
			};
		} );

		await import( '../../../../src/modules/file-field/view.js' );
		state = storeConfig.state;
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'Store registration', () => {
		test( 'registers into the shared jetpack/form store, not its own namespace', () => {
			expect( storeNamespace ).toBe( 'jetpack/form' );
		} );

		test( 'registers a `file` validator alongside the other field validators', () => {
			expect( typeof storeConfig.state.validators.file ).toBe( 'function' );
		} );
	} );

	describe( 'validators.file', () => {
		const validate = ( value, isRequired ) =>
			storeConfig.state.validators.file( value, isRequired );

		test( 'returns is_required when a required field has no files', () => {
			expect( validate( [], true ) ).toBe( 'is_required' );
		} );

		test( 'returns yes when an optional field has no files', () => {
			expect( validate( [], false ) ).toBe( 'yes' );
		} );

		test( 'treats an empty string as no files', () => {
			expect( validate( '', true ) ).toBe( 'is_required' );
			expect( validate( '', false ) ).toBe( 'yes' );
		} );

		test( 'reports files that failed', () => {
			expect( validate( [ { error: 'File is too large.', isUploaded: false } ], true ) ).toBe(
				'invalid_file_has_errors'
			);
		} );

		test( 'reports uploads still in flight, required or not', () => {
			expect( validate( [ { error: null, isUploaded: false } ], true ) ).toBe(
				'invalid_file_uploading'
			);
			expect( validate( [ { error: null, isUploaded: false } ], false ) ).toBe(
				'invalid_file_uploading'
			);
		} );

		test( 'passes once every file has uploaded', () => {
			expect( validate( [ { error: null, isUploaded: true } ], true ) ).toBe( 'yes' );
		} );

		test( 'flags errors ahead of pending uploads', () => {
			const value = [
				{ error: null, isUploaded: false },
				{ error: 'File is too large.', isUploaded: false },
			];
			expect( validate( value, true ) ).toBe( 'invalid_file_has_errors' );
		} );
	} );

	describe( 'State getters', () => {
		test( 'hasFileFieldFiles reflects the context files', () => {
			expect( state.hasFileFieldFiles ).toBe( false );
			mockContext.files = [ { id: '1' } ];
			expect( state.hasFileFieldFiles ).toBe( true );
		} );

		test( 'hasMaxFiles reads maxFiles from fieldExtra', () => {
			expect( state.hasMaxFiles ).toBe( false );
			mockContext.files = [ { id: '1' } ];
			expect( state.hasMaxFiles ).toBe( true );
		} );

		test( 'hasMaxFiles honours a larger maxFiles from fieldExtra', () => {
			mockContext.fieldExtra.maxFiles = 3;
			mockContext.files = [ { id: '1' }, { id: '2' } ];
			expect( state.hasMaxFiles ).toBe( false );
			mockContext.files.push( { id: '3' } );
			expect( state.hasMaxFiles ).toBe( true );
		} );

		test( 'falls back to a single file when fieldExtra is absent', () => {
			delete mockContext.fieldExtra;
			mockContext.files = [ { id: '1' } ];
			expect( state.hasMaxFiles ).toBe( true );
		} );
	} );

	describe( 'Adding files', () => {
		const makeFile = ( { name = 'doc.pdf', type = 'application/pdf', size = 10 } = {} ) => ( {
			name,
			type,
			size,
		} );

		test( 'accepts an allowed file and pushes it to the context', () => {
			storeConfig.actions.fileAdded( { target: { files: [ makeFile() ] } } );

			expect( mockContext.files ).toHaveLength( 1 );
			expect( mockContext.files[ 0 ] ).toMatchObject( {
				name: 'doc.pdf',
				hasError: false,
				isUploaded: false,
				error: null,
			} );
		} );

		test( 'rejects a MIME type missing from fieldExtra.allowedMimeTypes', () => {
			storeConfig.actions.fileAdded( {
				target: { files: [ makeFile( { name: 'evil.exe', type: 'application/x-msdownload' } ) ] },
			} );

			expect( mockContext.files[ 0 ] ).toMatchObject( {
				hasError: true,
				error: 'This file type is not allowed.',
			} );
		} );

		test( 'rejects a file over the configured max upload size', () => {
			storeConfig.actions.fileAdded( { target: { files: [ makeFile( { size: 2048 } ) ] } } );

			expect( mockContext.files[ 0 ] ).toMatchObject( {
				hasError: true,
				error: 'File is too large.',
			} );
		} );

		test( 'rejects a file beyond maxFiles', () => {
			mockContext.files = [ { id: 'existing', error: null } ];

			storeConfig.actions.fileAdded( { target: { files: [ makeFile() ] } } );

			expect( mockContext.files[ 1 ] ).toMatchObject( {
				hasError: true,
				error: 'Too many files.',
			} );
		} );

		test( 'pushes the value through the shared updateField action', () => {
			storeConfig.actions.fileAdded( { target: { files: [ makeFile() ] } } );

			expect( mockUpdateField ).toHaveBeenCalledWith( 'test-file', mockContext.files );
		} );
	} );

	describe( 'Drag and drop', () => {
		test( 'onFileDragOver marks the field as dropping and suppresses the default', () => {
			const event = { preventDefault: jest.fn() };
			storeConfig.actions.onFileDragOver( event );

			expect( mockContext.isDropping ).toBe( true );
			expect( event.preventDefault ).toHaveBeenCalled();
		} );

		test( 'onFileDragLeave clears the dropping flag', () => {
			mockContext.isDropping = true;
			storeConfig.actions.onFileDragLeave();

			expect( mockContext.isDropping ).toBe( false );
		} );

		test( 'a drop starts the fill timer, since no focus event fires for it', () => {
			storeConfig.actions.fileDropped( {
				preventDefault: jest.fn(),
				dataTransfer: { items: [] },
			} );

			expect( mockTrackFirstInteraction ).toHaveBeenCalled();
		} );

		test( 'a dropped directory is ignored', () => {
			storeConfig.actions.fileDropped( {
				preventDefault: jest.fn(),
				dataTransfer: {
					items: [
						{
							webkitGetAsEntry: () => ( { isDirectory: true } ),
							getAsFile: () => ( { name: 'folder', type: '', size: 0 } ),
						},
					],
				},
			} );

			expect( mockContext.files ).toHaveLength( 0 );
		} );
	} );

	describe( 'Keyboard handling', () => {
		test( 'onFileDropzoneKeyDown opens the picker on Enter', () => {
			const fileInput = document.querySelector( '.jetpack-form-file-field' );
			jest.spyOn( fileInput, 'click' ).mockImplementation();
			const event = { keyCode: 13, preventDefault: jest.fn() };

			storeConfig.actions.onFileDropzoneKeyDown( event );

			expect( event.preventDefault ).toHaveBeenCalled();
			expect( fileInput.click ).toHaveBeenCalled();
		} );

		test( 'onFileDropzoneKeyDown ignores other keys', () => {
			const fileInput = document.querySelector( '.jetpack-form-file-field' );
			jest.spyOn( fileInput, 'click' ).mockImplementation();

			storeConfig.actions.onFileDropzoneKeyDown( { keyCode: 65, preventDefault: jest.fn() } );

			expect( fileInput.click ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Resetting', () => {
		test( 'resetFiles empties the context', () => {
			mockContext.files = [ { id: '1' }, { id: '2' } ];
			storeConfig.actions.resetFiles();

			expect( mockContext.files ).toEqual( [] );
		} );
	} );

	describe( 'Upload token', () => {
		test( 'concurrent uploads share a single token request', async () => {
			const fetchMock = jest.fn( () =>
				Promise.resolve( {
					ok: true,
					json: () => Promise.resolve( { token: 'abc', expiration: 0 } ),
				} )
			);
			global.fetch = fetchMock;

			// Drive two uploads up to their first yield, which is the token request.
			const first = storeConfig.actions.uploadFile( { name: 'a.pdf' }, 'client-1' );
			const second = storeConfig.actions.uploadFile( { name: 'b.pdf' }, 'client-2' );

			await Promise.all( [ first.next().value, second.next().value ] );

			expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'Focus management', () => {
		test( 'focusFilePreview focuses the preview and nothing else', () => {
			jest.useFakeTimers();
			const focus = jest.fn();
			mockGetElement.mockReturnValue( { ref: { focus } } );

			const result = storeConfig.callbacks.focusFilePreview();
			jest.runAllTimers();

			expect( focus ).toHaveBeenCalledWith( { focusVisible: true } );
			// Returning a function would be invoked immediately by the `data-wp-init` directive,
			// which is what previously stole focus back to the (hidden) dropzone.
			expect( typeof result ).not.toBe( 'function' );
			jest.useRealTimers();
		} );
	} );
} );
