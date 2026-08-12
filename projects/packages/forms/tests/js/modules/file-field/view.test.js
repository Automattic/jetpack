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

		// Namespace-aware on purpose: the field's config lives under `jetpack/field-file` while
		// its store lives under `jetpack/form`. A namespace-agnostic mock would let that split
		// silently collapse, which is the exact thing this module is meant to establish.
		mockGetConfig.mockImplementation( namespace => {
			if ( namespace !== 'jetpack/field-file' ) {
				throw new Error( `Unexpected config namespace: ${ namespace }` );
			}
			return {
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
			};
		} );

		// jsdom implements neither of these, so they have to be defined before they can be spied
		// on. Without them every file silently takes the non-image icon path, and an
		// image-preview assertion would pass for the wrong reason.
		global.URL.createObjectURL ??= () => '';
		global.URL.revokeObjectURL ??= () => {};
		jest.spyOn( global.URL, 'createObjectURL' ).mockImplementation( () => 'blob:mock' );
		jest.spyOn( global.URL, 'revokeObjectURL' ).mockImplementation();

		// Likewise absent from this jsdom environment; define so individual tests can spy.
		global.fetch ??= () => Promise.resolve();

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

		test( 'isFileFieldFull reads maxFiles from fieldExtra', () => {
			expect( state.isFileFieldFull ).toBe( false );
			mockContext.files = [ { id: '1' } ];
			expect( state.isFileFieldFull ).toBe( true );
		} );

		test( 'isFileFieldFull honours a larger maxFiles from fieldExtra', () => {
			mockContext.fieldExtra.maxFiles = 3;
			mockContext.files = [ { id: '1' }, { id: '2' } ];
			expect( state.isFileFieldFull ).toBe( false );
			mockContext.files.push( { id: '3' } );
			expect( state.isFileFieldFull ).toBe( true );
		} );

		test( 'falls back to a single file when fieldExtra is absent', () => {
			delete mockContext.fieldExtra;
			mockContext.files = [ { id: '1' } ];
			expect( state.isFileFieldFull ).toBe( true );
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

			// Snapshot the argument rather than comparing `mockContext.files` to itself, which
			// would pass for any contents.
			expect( mockUpdateField ).toHaveBeenCalledTimes( 1 );
			const [ fieldId, value ] = mockUpdateField.mock.calls[ 0 ];
			expect( fieldId ).toBe( 'test-file' );
			expect( value ).toHaveLength( 1 );
			expect( value[ 0 ] ).toMatchObject( { name: 'doc.pdf', isUploaded: false, error: null } );
		} );

		test( 'builds an object URL preview for image types', () => {
			storeConfig.actions.fileAdded( {
				target: { files: [ makeFile( { name: 'photo.png', type: 'image/png' } ) ] },
			} );

			expect( global.URL.createObjectURL ).toHaveBeenCalled();
			expect( mockContext.files[ 0 ] ).toMatchObject( {
				hasIcon: false,
				url: 'url(blob:mock)',
				mask: null,
			} );
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

		test( 'a dropped directory is skipped', () => {
			mockContext.isDropping = true;

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
			// Bailing out of the loop used to skip this, stranding the dropzone in drag-hover.
			expect( mockContext.isDropping ).toBe( false );
		} );

		test( 'a directory does not discard the rest of a mixed drop', () => {
			const item = ( isDirectory, file ) => ( {
				webkitGetAsEntry: () => ( { isDirectory } ),
				getAsFile: () => file,
			} );

			storeConfig.actions.fileDropped( {
				preventDefault: jest.fn(),
				dataTransfer: {
					items: [
						item( true, { name: 'folder', type: '', size: 0 } ),
						item( false, { name: 'doc.pdf', type: 'application/pdf', size: 10 } ),
					],
				},
			} );

			expect( mockContext.files ).toHaveLength( 1 );
			expect( mockContext.files[ 0 ] ).toMatchObject( { name: 'doc.pdf' } );
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

	describe( 'Removing files', () => {
		/**
		 * Drive the `removeFile` generator to completion.
		 *
		 * @param {string} id - The client file ID to remove.
		 * @return {Promise} Resolves when the generator is done.
		 */
		const removeFile = async id => {
			const event = {
				preventDefault: jest.fn(),
				target: { dataset: { id } },
			};
			const generator = storeConfig.actions.removeFile( event );
			let step = generator.next();
			while ( ! step.done ) {
				step = generator.next( await step.value );
			}
		};

		test( 'removes the file and reports the remaining list, not an empty string', async () => {
			mockContext.files = [
				{ id: 'a', url: null, error: null },
				{ id: 'b', url: null, error: null },
			];

			await removeFile( 'a' );

			expect( mockContext.files.map( f => f.id ) ).toEqual( [ 'b' ] );
			// An empty array is a legitimate value now — the registered validator turns it into
			// `is_required` or `yes`, so there is no need to substitute ''.
			await removeFile( 'b' );
			const [ , lastValue ] = mockUpdateField.mock.calls.at( -1 );
			expect( lastValue ).toEqual( [] );
		} );

		test( 'revokes the object URL of a removed image preview', async () => {
			mockContext.files = [ { id: 'a', url: 'url(blob:mock)', error: null } ];

			await removeFile( 'a' );

			expect( global.URL.revokeObjectURL ).toHaveBeenCalledWith( 'blob:mock' );
		} );
	} );

	describe( 'Upload lifecycle', () => {
		/**
		 * A minimal XMLHttpRequest double that lets a test drive readystatechange.
		 *
		 * @return {object} The fake request and its captured listeners.
		 */
		const installFakeXhr = () => {
			const listeners = {};
			const xhr = {
				readyState: 4,
				status: 200,
				responseText: JSON.stringify( {
					success: true,
					data: { file_id: 'server-1', name: 'doc.pdf', size: 10, type: 'application/pdf' },
				} ),
				open: jest.fn(),
				send: jest.fn(),
				abort: jest.fn(),
				upload: { addEventListener: jest.fn() },
				addEventListener: jest.fn( ( name, cb ) => {
					listeners[ name ] = cb;
				} ),
			};
			jest.spyOn( global, 'XMLHttpRequest' ).mockImplementation( () => xhr );
			return { xhr, listeners };
		};

		test( 'a settled request marks the file uploaded and drops its abort controller', async () => {
			jest.spyOn( global, 'fetch' ).mockImplementation( () =>
				Promise.resolve( {
					ok: true,
					json: () => Promise.resolve( { token: 'abc', expiration: 0 } ),
				} )
			);
			const { xhr, listeners } = installFakeXhr();
			mockContext.files = [ { id: 'client-1', error: null, isUploaded: false } ];

			const generator = storeConfig.actions.uploadFile( { name: 'doc.pdf' }, 'client-1' );
			let step = generator.next();
			while ( ! step.done ) {
				step = generator.next( await step.value );
			}

			// Settle the request the way the browser would.
			listeners.readystatechange( { target: xhr } );

			expect( mockContext.files[ 0 ] ).toMatchObject( {
				isUploaded: true,
				file_id: 'server-1',
			} );

			// The controller is gone, so a later remove cannot abort an already-finished request.
			await ( async () => {
				const event = { preventDefault: jest.fn(), target: { dataset: { id: 'client-1' } } };
				const gen = storeConfig.actions.removeFile( event );
				let s = gen.next();
				while ( ! s.done ) {
					s = gen.next( await s.value );
				}
			} )();

			expect( xhr.abort ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Upload token', () => {
		test( 'concurrent uploads share a single token request', async () => {
			const fetchMock = jest.spyOn( global, 'fetch' ).mockImplementation( () =>
				Promise.resolve( {
					ok: true,
					json: () => Promise.resolve( { token: 'abc', expiration: 0 } ),
				} )
			);

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
