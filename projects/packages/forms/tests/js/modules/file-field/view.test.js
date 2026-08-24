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
	let legacyContext;
	let mockElement;
	let storeConfig;
	let storeConfigs;
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

		// Contexts are per-namespace. Current markup puts everything the field needs in the
		// `jetpack/form` context; the legacy namespace is empty unless a back-compat test sets it.
		legacyContext = null;
		mockGetContext.mockImplementation( namespace =>
			namespace === 'jetpack/field-file' ? legacyContext : mockContext
		);
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

		// The module registers twice: the real store under `jetpack/form`, then a back-compat alias
		// under the old `jetpack/field-file` namespace. Keep them apart so tests can address either.
		storeConfigs = {};
		mockStore.mockImplementation( ( namespace, config ) => {
			storeConfigs[ namespace ] = config;
			return {
				state: config.state,
				actions: {
					...config.actions,
					updateField: mockUpdateField,
					trackFirstInteraction: mockTrackFirstInteraction,
				},
				callbacks: config.callbacks,
			};
		} );

		await import( '../../../../src/modules/file-field/view.js' );
		storeConfig = storeConfigs[ 'jetpack/form' ];
		state = storeConfig.state;
	} );

	afterEach( () => {
		document.body.innerHTML = '';
		// clearAllMocks does not undo a mockImplementation, and the shared jest config sets
		// neither restoreMocks nor clearMocks — without this, a spy on fetch or XMLHttpRequest set
		// inside one test body silently leaks into every test declared after it.
		jest.restoreAllMocks();
	} );

	/**
	 * Remove a file. `removeFile` is synchronous: the server-side delete is fired without blocking
	 * the UI update, so the context reflects the removal on return.
	 *
	 * @param {string} id - The client file ID to remove.
	 */
	const removeFile = id => {
		storeConfig.actions.removeFile( {
			preventDefault: jest.fn(),
			target: { dataset: { id } },
		} );
	};

	/**
	 * Answer the upload-token request with a usable token.
	 *
	 * @return {jest.Mock} The fetch spy.
	 */
	const mockTokenFetch = () =>
		jest.spyOn( global, 'fetch' ).mockImplementation( () =>
			Promise.resolve( {
				ok: true,
				json: () => Promise.resolve( { token: 'abc', expiration: 0 } ),
			} )
		);

	/**
	 * Drive a generator action to completion, awaiting whatever it yields.
	 *
	 * @param {Generator} generator - The generator to drain.
	 */
	const drainGenerator = async generator => {
		let step = generator.next();
		while ( ! step.done ) {
			step = generator.next( await step.value );
		}
	};

	describe( 'Store registration', () => {
		test( 'registers into the shared form store first, then the back-compat alias', () => {
			expect( Object.keys( storeConfigs ) ).toEqual( [ 'jetpack/form', 'jetpack/field-file' ] );
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

		/**
		 * Build a DataTransferItem double.
		 *
		 * @param {object}      options             - Item options.
		 * @param {string}      options.kind        - 'file' or 'string'.
		 * @param {boolean}     options.isDirectory - Whether the entry is a directory.
		 * @param {object|null} options.file        - The file the item yields.
		 * @return {object} The item double.
		 */
		const dropItem = ( { kind = 'file', isDirectory = false, file = null } = {} ) => ( {
			kind,
			// Both of these return null for a `string` item, which is what makes the kind check
			// load-bearing rather than cosmetic.
			webkitGetAsEntry: () => ( kind === 'file' ? { isDirectory } : null ),
			getAsFile: () => ( kind === 'file' ? file : null ),
		} );

		const drop = items =>
			storeConfig.actions.fileDropped( {
				preventDefault: jest.fn(),
				dataTransfer: { items },
			} );

		test( 'a dropped directory is skipped', () => {
			mockContext.isDropping = true;

			drop( [ dropItem( { isDirectory: true, file: { name: 'folder', type: '', size: 0 } } ) ] );

			expect( mockContext.files ).toHaveLength( 0 );
			// Bailing out of the loop used to skip this, stranding the dropzone in drag-hover.
			expect( mockContext.isDropping ).toBe( false );
		} );

		test( 'a directory does not discard the rest of a mixed drop', () => {
			drop( [
				dropItem( { isDirectory: true, file: { name: 'folder', type: '', size: 0 } } ),
				dropItem( { file: { name: 'doc.pdf', type: 'application/pdf', size: 10 } } ),
			] );

			expect( mockContext.files ).toHaveLength( 1 );
			expect( mockContext.files[ 0 ] ).toMatchObject( { name: 'doc.pdf' } );
		} );

		test( 'dragged text or links are ignored without throwing', () => {
			// `kind: 'string'` items return null from webkitGetAsEntry() and getAsFile(). Skipping
			// only directories let those through to a null dereference, which threw mid-loop and
			// left the dropzone stuck in drag-hover.
			mockContext.isDropping = true;

			expect( () =>
				drop( [
					dropItem( { kind: 'string' } ),
					dropItem( { file: { name: 'doc.pdf', type: 'application/pdf', size: 10 } } ),
				] )
			).not.toThrow();

			expect( mockContext.files ).toHaveLength( 1 );
			expect( mockContext.isDropping ).toBe( false );
		} );
	} );

	describe( 'Keyboard handling', () => {
		test( 'onFileDropzoneKeyDown opens the picker on Enter', () => {
			const fileInput = document.querySelector( '.jetpack-form-file-field' );
			jest.spyOn( fileInput, 'click' ).mockImplementation();
			const event = { key: 'Enter', preventDefault: jest.fn() };

			storeConfig.actions.onFileDropzoneKeyDown( event );

			expect( event.preventDefault ).toHaveBeenCalled();
			expect( fileInput.click ).toHaveBeenCalled();
		} );

		test( 'onFileDropzoneKeyDown ignores other keys', () => {
			const fileInput = document.querySelector( '.jetpack-form-file-field' );
			jest.spyOn( fileInput, 'click' ).mockImplementation();

			storeConfig.actions.onFileDropzoneKeyDown( { key: 'a', preventDefault: jest.fn() } );

			expect( fileInput.click ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Removing files', () => {
		test( 'removes the file and reports the remaining list, not an empty string', () => {
			mockContext.files = [
				{ id: 'a', url: null, error: null },
				{ id: 'b', url: null, error: null },
			];

			removeFile( 'a' );

			expect( mockContext.files.map( f => f.id ) ).toEqual( [ 'b' ] );
			// An empty array is a legitimate value now — the registered validator turns it into
			// `is_required` or `yes`, so there is no need to substitute ''.
			removeFile( 'b' );
			const [ , lastValue ] = mockUpdateField.mock.calls.at( -1 );
			expect( lastValue ).toEqual( [] );
		} );

		test( 'updates the field without waiting on the server-side delete', () => {
			// A token round-trip before removal left the preview in place and the dropzone hidden,
			// so a slow network made the field look stuck with no way to add a replacement.
			const fetchSpy = jest
				.spyOn( global, 'fetch' )
				.mockImplementation( () => new Promise( () => {} ) );
			mockContext.files = [ { id: 'a', url: null, error: null, file_id: 'server-1' } ];

			removeFile( 'a' );

			expect( mockContext.files ).toEqual( [] );
			expect( mockUpdateField ).toHaveBeenCalledWith( 'test-file', [] );
			expect( fetchSpy ).toHaveBeenCalled();
		} );

		test( 'a second activation is a no-op rather than a duplicate delete', () => {
			mockContext.files = [ { id: 'a', url: 'url(blob:mock)', error: null } ];

			removeFile( 'a' );
			removeFile( 'a' );

			expect( global.URL.revokeObjectURL ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'revokes the object URL of a removed image preview', () => {
			mockContext.files = [ { id: 'a', url: 'url(blob:mock)', error: null } ];

			removeFile( 'a' );

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
			mockTokenFetch();
			const { xhr, listeners } = installFakeXhr();
			mockContext.files = [ { id: 'client-1', error: null, isUploaded: false } ];

			await drainGenerator( storeConfig.actions.uploadFile( { name: 'doc.pdf' }, 'client-1' ) );

			// Settle the request the way the browser would.
			listeners.readystatechange( { target: xhr } );

			expect( mockContext.files[ 0 ] ).toMatchObject( {
				isUploaded: true,
				file_id: 'server-1',
			} );

			// The controller is gone, so a later remove cannot abort an already-finished request.
			removeFile( 'client-1' );

			expect( xhr.abort ).not.toHaveBeenCalled();
		} );

		test( 'does not send a file that was removed while its token was in flight', async () => {
			// Nothing is registered in uploadControllers until after the token resolves, so a
			// removal during that window has nothing to abort and would otherwise upload a file the
			// user already deleted.
			mockTokenFetch();
			const { xhr } = installFakeXhr();
			mockContext.files = [ { id: 'client-1', error: null, isUploaded: false } ];

			const generator = storeConfig.actions.uploadFile( { name: 'doc.pdf' }, 'client-1' );
			const tokenPromise = generator.next().value;

			// The user removes the file before the token comes back.
			mockContext.files = [];

			let step = generator.next( await tokenPromise );
			while ( ! step.done ) {
				step = generator.next( await step.value );
			}

			expect( xhr.send ).not.toHaveBeenCalled();
		} );

		test( 'an XHR event arriving after a reset is ignored', async () => {
			// resetFiles empties the list without waiting for in-flight requests, so an event can
			// arrive for an entry that is gone. Object.assign( undefined, … ) used to throw.
			mockTokenFetch();
			const { xhr, listeners } = installFakeXhr();
			mockContext.files = [ { id: 'client-1', error: null, isUploaded: false } ];

			await drainGenerator( storeConfig.actions.uploadFile( { name: 'doc.pdf' }, 'client-1' ) );
			storeConfig.actions.resetFiles();

			expect( () => listeners.readystatechange( { target: xhr } ) ).not.toThrow();
			expect( mockContext.files ).toEqual( [] );
		} );

		test( 'resetFiles releases controllers and object URLs like removeFile does', () => {
			mockContext.files = [ { id: 'a', url: 'url(blob:mock)', error: null } ];

			storeConfig.actions.resetFiles();

			expect( global.URL.revokeObjectURL ).toHaveBeenCalledWith( 'blob:mock' );
			expect( mockContext.files ).toEqual( [] );
		} );
	} );

	describe( 'Upload token', () => {
		test( 'concurrent uploads share a single token request', async () => {
			const fetchMock = mockTokenFetch();

			// Drive two uploads up to their first yield, which is the token request.
			const first = storeConfig.actions.uploadFile( { name: 'a.pdf' }, 'client-1' );
			const second = storeConfig.actions.uploadFile( { name: 'b.pdf' }, 'client-2' );

			await Promise.all( [ first.next().value, second.next().value ] );

			expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'Back-compat alias for cached markup', () => {
		let legacyStore;

		beforeEach( () => {
			legacyStore = storeConfigs[ 'jetpack/field-file' ];

			// What a page cached before this change serves: the file state under the old namespace,
			// config as loose keys rather than in fieldExtra.
			legacyContext = {
				fieldId: 'test-file',
				files: [],
				isDropping: false,
				maxFiles: 1,
				allowedMimeTypes: ALLOWED_MIME_TYPES,
			};
			/*
			 * The shared wrapper context is still emitted by unchanged PHP, which knows nothing
			 * about the file field but does emit `fieldExtra`. For a file field that was
			 * `get_field_extra()`'s untouched empty `$extra_attrs`, and `wp_json_encode()` writes
			 * an empty PHP array as `[]` — truthy in JS. Leaving the key out here would let a
			 * presence-only bridge guard pass a test it fails against real markup.
			 */
			mockContext = { fieldId: 'test-file', fieldType: 'file', fields: {}, fieldExtra: [] };
		} );

		test( 'adding a file through the old action name still reaches the shared field state', () => {
			legacyStore.actions.fileAdded( {
				target: { files: [ { name: 'doc.pdf', type: 'application/pdf', size: 10 } ] },
			} );

			// The same array backs both contexts, so the old template's data-wp-each stays in step.
			expect( legacyContext.files ).toHaveLength( 1 );
			expect( mockContext.files ).toBe( legacyContext.files );
			expect( mockUpdateField ).toHaveBeenCalledWith( 'test-file', legacyContext.files );
		} );

		test( 'removing a file through the old action name keeps both contexts on the same array', () => {
			legacyStore.actions.fileAdded( {
				target: { files: [ { name: 'doc.pdf', type: 'application/pdf', size: 10 } ] },
			} );
			const sharedArray = legacyContext.files;
			const [ added ] = legacyContext.files;

			legacyStore.actions.removeFile( {
				preventDefault: jest.fn(),
				target: { dataset: { id: added.id } },
			} );

			// Removed in place, so the old template's data-wp-each drops the preview too rather than
			// stranding it on a stale array.
			expect( legacyContext.files ).toBe( sharedArray );
			expect( mockContext.files ).toBe( legacyContext.files );
			expect( legacyContext.files ).toHaveLength( 0 );
		} );

		test( 'resetFiles through the old action name empties the shared array in place', () => {
			legacyStore.actions.fileAdded( {
				target: { files: [ { name: 'doc.pdf', type: 'application/pdf', size: 10 } ] },
			} );
			const sharedArray = legacyContext.files;

			legacyStore.actions.resetFiles();

			expect( legacyContext.files ).toBe( sharedArray );
			expect( mockContext.files ).toBe( legacyContext.files );
			expect( legacyContext.files ).toHaveLength( 0 );
		} );

		test( 'the old config keys are bridged into fieldExtra so limits still apply', () => {
			legacyStore.actions.fileAdded( {
				target: { files: [ { name: 'evil.exe', type: 'application/x-msdownload', size: 10 } ] },
			} );

			expect( legacyContext.files[ 0 ] ).toMatchObject( {
				hasError: true,
				error: 'This file type is not allowed.',
			} );
		} );

		test( 'an allowed type is still accepted when the wrapper already emits an empty fieldExtra', () => {
			legacyStore.actions.fileAdded( {
				target: { files: [ { name: 'doc.pdf', type: 'application/pdf', size: 10 } ] },
			} );

			// Bridging keyed on presence rather than shape would leave an empty allowlist here and
			// reject every file, which on a required field can never be cleared.
			expect( legacyContext.files[ 0 ].hasError ).toBeFalsy();
		} );

		test( 'the old drag actions toggle the flag the old markup binds to', () => {
			legacyStore.actions.dragOver( { preventDefault: jest.fn() } );
			expect( legacyContext.isDropping ).toBe( true );

			legacyStore.actions.dragLeave();
			expect( legacyContext.isDropping ).toBe( false );
		} );

		test( 'dropping clears the drag highlight on the context the old markup binds', () => {
			legacyStore.actions.dragOver( { preventDefault: jest.fn() } );
			expect( legacyContext.isDropping ).toBe( true );

			legacyStore.actions.fileDropped( {
				preventDefault: jest.fn(),
				dataTransfer: {
					items: [
						{
							kind: 'file',
							webkitGetAsEntry: () => ( { isDirectory: false } ),
							getAsFile: () => ( { name: 'doc.pdf', type: 'application/pdf', size: 10 } ),
						},
					],
				},
			} );

			// The shared implementation resets the shared context; the old template watches this one.
			expect( legacyContext.isDropping ).toBe( false );
		} );

		test( 'the old state getters resolve against the legacy context', () => {
			expect( legacyStore.state.hasFiles ).toBe( false );
			expect( legacyStore.state.hasMaxFiles ).toBe( false );

			legacyContext.files.push( { id: '1' } );

			expect( legacyStore.state.hasFiles ).toBe( true );
			expect( legacyStore.state.hasMaxFiles ).toBe( true );
		} );
	} );

	describe( 'Focus management', () => {
		/**
		 * Mount a preview inside the dropzone container and run the init callback against it.
		 *
		 * @return {{preview: HTMLElement, dropzone: HTMLElement, cleanup: Function}} The nodes and the effect cleanup the callback returned.
		 */
		const mountPreview = () => {
			const container = document.querySelector( '.jetpack-form-file-field__container' );
			const preview = document.createElement( 'div' );
			preview.className = 'jetpack-form-file-field__preview';
			preview.tabIndex = 0;
			container.querySelector( '.jetpack-form-file-field__preview-wrap' ).append( preview );

			const dropzone = container.querySelector( '.jetpack-form-file-field__dropzone-inner' );
			jest.spyOn( preview, 'focus' );
			jest.spyOn( dropzone, 'focus' );

			mockGetElement.mockReturnValue( { ref: preview } );

			return { preview, dropzone, cleanup: storeConfig.callbacks.focusFilePreview() };
		};

		test( 'focuses the new preview on mount', () => {
			jest.useFakeTimers();
			const { preview, dropzone } = mountPreview();

			jest.runAllTimers();

			expect( preview.focus ).toHaveBeenCalledWith( { focusVisible: true } );
			expect( dropzone.focus ).not.toHaveBeenCalled();
			jest.useRealTimers();
		} );

		test( 'returns a cleanup that hands focus back to the dropzone on removal', () => {
			// `data-wp-init` resolves the callback without invoking it, calls it once, and passes
			// the return value to useEffect as teardown — so returning a function here is how focus
			// is restored when the file is removed, not a bug.
			jest.useFakeTimers();
			const { preview, dropzone, cleanup } = mountPreview();
			jest.runAllTimers();

			expect( typeof cleanup ).toBe( 'function' );

			preview.remove();
			cleanup();
			jest.runAllTimers();

			expect( dropzone.focus ).toHaveBeenCalledWith( { focusVisible: true } );
			jest.useRealTimers();
		} );

		test( 'does not focus a preview that was removed inside the delay', () => {
			jest.useFakeTimers();
			const { preview, cleanup } = mountPreview();

			// Remove before the timer fires: focusing a detached node is a silent no-op that would
			// leave focus on <body>.
			preview.remove();
			cleanup();
			jest.runAllTimers();

			expect( preview.focus ).not.toHaveBeenCalled();
			jest.useRealTimers();
		} );
	} );
} );
