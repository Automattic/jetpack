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
	let storeReturns;
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
				<p class="jetpack-form-file-field__notice" role="status"></p>
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
			fileNotice: '',
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
					folderNotSupported: 'Folder uploads are not supported',
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
		// `storeReturns` holds what the module itself destructured, so assigning over one of its
		// actions is the only way a test can intercept an internal call: the module closed over this
		// object, not over `storeConfigs`.
		storeConfigs = {};
		storeReturns = {};
		mockStore.mockImplementation( ( namespace, config ) => {
			storeConfigs[ namespace ] = config;
			storeReturns[ namespace ] = {
				state: config.state,
				actions: {
					...config.actions,
					updateField: mockUpdateField,
					trackFirstInteraction: mockTrackFirstInteraction,
				},
				callbacks: config.callbacks,
			};
			return storeReturns[ namespace ];
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
			/*
			 * A real abort() drives the request to readyState 4 with status 0 and fires
			 * readystatechange synchronously. Stubbing that away left the abort path — which is how
			 * every removal and every reset settles an in-flight upload — completely unexercised.
			 */
			abort: jest.fn( () => {
				xhr.status = 0;
				listeners.readystatechange?.( { target: xhr } );
			} ),
			upload: { addEventListener: jest.fn() },
			addEventListener: jest.fn( ( name, cb ) => {
				listeners[ name ] = cb;
			} ),
		};
		jest.spyOn( global, 'XMLHttpRequest' ).mockImplementation( () => xhr );
		return { xhr, listeners };
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

		test( 'isFileFieldFull counts a file that failed validation', () => {
			// Errored entries have to hold their place. If they did not, picking a disallowed file
			// over and over would add an unbounded number of previews, every one of which blocks
			// submission through validators.file — the pile-up this batch work exists to end. The
			// visitor clears a rejected file with its own × button.
			mockContext.files = [ { id: '1', error: 'This file type is not allowed.' } ];
			expect( state.isFileFieldFull ).toBe( true );
		} );

		test( 'hasFileFieldNotice follows the field-level notice', () => {
			expect( state.hasFileFieldNotice ).toBe( false );
			mockContext.fileNotice = 'Too many files.';
			expect( state.hasFileFieldNotice ).toBe( true );
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

		test( 'reports the type when a file is both oversized and of a disallowed type', () => {
			// No smaller version of that file would be accepted either, so the type is the more
			// useful of the two to report. The original code got this order by accident, with the
			// type assignment overwriting the size one; pinning it here keeps a later reshuffle of
			// the two checks from quietly swapping the message.
			storeConfig.actions.fileAdded( {
				target: {
					files: [ makeFile( { name: 'huge.exe', type: 'application/x-msdownload', size: 2048 } ) ],
				},
			} );

			expect( mockContext.files[ 0 ].error ).toBe( 'This file type is not allowed.' );
		} );

		test( 'rejects a file over the configured max upload size', () => {
			storeConfig.actions.fileAdded( { target: { files: [ makeFile( { size: 2048 } ) ] } } );

			expect( mockContext.files[ 0 ] ).toMatchObject( {
				hasError: true,
				error: 'File is too large.',
			} );
		} );

		test( 'declines a file beyond maxFiles instead of giving it an error preview', () => {
			// An over-limit file used to be added with the "too many files" message on its own
			// preview, which `validators.file` then reported as `invalid_file_has_errors` — so the
			// form could not be submitted until the visitor dismissed a file they never chose to add.
			mockContext.files = [ { id: 'existing', error: null } ];

			storeConfig.actions.fileAdded( { target: { files: [ makeFile() ] } } );

			expect( mockContext.files ).toHaveLength( 1 );
			expect( mockContext.fileNotice ).toBe( 'Too many files.' );
		} );

		test( 'takes a batch up to the limit and declines only the overflow', () => {
			mockContext.fieldExtra.maxFiles = 2;

			storeConfig.actions.fileAdded( {
				target: {
					files: [
						makeFile( { name: 'a.pdf' } ),
						makeFile( { name: 'b.pdf' } ),
						makeFile( { name: 'c.pdf' } ),
					],
				},
			} );

			expect( mockContext.files.map( file => file.name ) ).toEqual( [ 'a.pdf', 'b.pdf' ] );
			expect( mockContext.files.every( file => ! file.error ) ).toBe( true );
			expect( mockContext.fileNotice ).toBe( 'Too many files.' );
		} );

		test( 'says nothing when the whole batch fits', () => {
			mockContext.fieldExtra.maxFiles = 2;

			storeConfig.actions.fileAdded( {
				target: { files: [ makeFile( { name: 'a.pdf' } ), makeFile( { name: 'b.pdf' } ) ] },
			} );

			expect( mockContext.fileNotice ).toBe( '' );
		} );

		test( 'a file rejected for its type holds a place until a usable file replaces it', () => {
			// Picking one bad and one good file at once on a single-file field is ordinary. The bad
			// one takes the only slot, then the good one displaces it — rather than the visitor being
			// told they have too many files while looking at exactly one.
			storeConfig.actions.fileAdded( {
				target: {
					files: [
						makeFile( { name: 'evil.exe', type: 'application/x-msdownload' } ),
						makeFile( { name: 'good.pdf' } ),
					],
				},
			} );

			expect( mockContext.files ).toHaveLength( 1 );
			expect( mockContext.files[ 0 ] ).toMatchObject( { name: 'good.pdf', error: null } );
			expect( mockContext.fileNotice ).toBe( '' );
		} );

		test( 'a rejected file left on its own is replaced by the next usable one', () => {
			// The dropzone is hidden while the field is full, but the container still takes drops, so
			// this is how a visitor supplies the replacement they are being asked for.
			storeConfig.actions.fileAdded( {
				target: { files: [ makeFile( { name: 'evil.exe', type: 'application/x-msdownload' } ) ] },
			} );
			expect( mockContext.files[ 0 ] ).toMatchObject( { hasError: true } );

			storeConfig.actions.fileAdded( { target: { files: [ makeFile( { name: 'good.pdf' } ) ] } } );

			expect( mockContext.files ).toHaveLength( 1 );
			expect( mockContext.files[ 0 ] ).toMatchObject( { name: 'good.pdf', error: null } );
			expect( mockContext.fileNotice ).toBe( '' );
		} );

		test( 'a successfully uploaded file is never displaced', () => {
			// Eviction is only ever a rejected file making way; a file the visitor uploaded stays.
			mockContext.files = [ { id: 'kept', name: 'kept.pdf', error: null } ];

			storeConfig.actions.fileAdded( { target: { files: [ makeFile( { name: 'new.pdf' } ) ] } } );

			expect( mockContext.files ).toHaveLength( 1 );
			expect( mockContext.files[ 0 ] ).toMatchObject( { name: 'kept.pdf' } );
			expect( mockContext.fileNotice ).toBe( 'Too many files.' );
		} );

		test( 'a batch of nothing but invalid files cannot exceed the limit', () => {
			// The regression this guards: the capacity check used to sit inside `if ( ! error )`, so
			// every invalid file was admitted unconditionally. Six of them on a one-file field left
			// six previews, each reporting invalid_file_has_errors, all to be dismissed by hand.
			storeConfig.actions.fileAdded( {
				target: {
					files: Array.from( { length: 6 }, ( _, index ) =>
						makeFile( { name: `bad-${ index }.exe`, type: 'application/x-msdownload' } )
					),
				},
			} );

			expect( mockContext.files ).toHaveLength( 1 );
			expect( state.isFileFieldFull ).toBe( true );
		} );

		test( 'repeated picks of a disallowed file do not accumulate', () => {
			for ( let attempt = 0; attempt < 4; attempt++ ) {
				storeConfig.actions.fileAdded( {
					target: {
						files: [ makeFile( { name: 'evil.exe', type: 'application/x-msdownload' } ) ],
					},
				} );
			}

			expect( mockContext.files ).toHaveLength( 1 );
		} );

		test( 'clears a stale notice when a later batch fits', () => {
			mockContext.fieldExtra.maxFiles = 2;
			mockContext.fileNotice = 'Too many files.';

			storeConfig.actions.fileAdded( { target: { files: [ makeFile() ] } } );

			expect( mockContext.fileNotice ).toBe( '' );
		} );

		test( 'reports the whole batch to the form once rather than once per file', () => {
			mockContext.fieldExtra.maxFiles = 3;

			storeConfig.actions.fileAdded( {
				target: { files: [ makeFile(), makeFile(), makeFile() ] },
			} );

			expect( mockUpdateField ).toHaveBeenCalledTimes( 1 );
			expect( mockUpdateField.mock.calls[ 0 ][ 1 ] ).toHaveLength( 3 );
		} );

		test( 'clears a stale overflow notice once a file is removed', () => {
			mockContext.files = [ { id: 'existing', error: null } ];
			storeConfig.actions.fileAdded( { target: { files: [ makeFile() ] } } );
			expect( mockContext.fileNotice ).toBe( 'Too many files.' );

			removeFile( 'existing' );

			expect( mockContext.fileNotice ).toBe( '' );
		} );

		test( 'clears the notice on reset', () => {
			mockContext.fileNotice = 'Too many files.';

			storeConfig.actions.resetFiles();

			expect( mockContext.fileNotice ).toBe( '' );
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

		test( 'a dropped directory is skipped, and says so', () => {
			mockContext.isDropping = true;

			drop( [ dropItem( { isDirectory: true, file: { name: 'folder', type: '', size: 0 } } ) ] );

			expect( mockContext.files ).toHaveLength( 0 );
			// Bailing out of the loop used to skip this, stranding the dropzone in drag-hover.
			expect( mockContext.isDropping ).toBe( false );
			// Ignoring it in silence leaves the visitor waiting for an upload that will never start.
			expect( mockContext.fileNotice ).toBe( 'Folder uploads are not supported' );
		} );

		test( 'a folder dropped after an overflow does not inherit the overflow message', () => {
			mockContext.fileNotice = 'Too many files.';

			drop( [ dropItem( { isDirectory: true, file: { name: 'folder', type: '', size: 0 } } ) ] );

			expect( mockContext.fileNotice ).toBe( 'Folder uploads are not supported' );
		} );

		test( 'a drop of only unresolvable items leaves the field alone', () => {
			// getAsFile() can return null even for a `file` item. Pushing that null made the batch
			// look non-empty, which cleared a legitimate notice and re-nominated a focus target for
			// a batch that would mount nothing.
			mockContext.fileNotice = 'Too many files.';

			drop( [ dropItem( { file: null } ) ] );

			expect( mockContext.files ).toHaveLength( 0 );
			expect( mockContext.fileNotice ).toBe( 'Too many files.' );
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

	describe( 'Declining without a notice element', () => {
		test( 'markup with no notice element gets one errored preview rather than silence', () => {
			// Pages cached before the notice element existed are served against this bundle — the
			// window the back-compat shim covers. There is nowhere to render fileNotice there, and
			// declining silently would make the visitor's files simply disappear.
			document.querySelector( '.jetpack-form-file-field__notice' ).remove();
			mockContext.files = [ { id: 'existing', error: null } ];

			storeConfig.actions.fileAdded( {
				target: {
					files: [
						{ name: 'a.pdf', type: 'application/pdf', size: 10 },
						{ name: 'b.pdf', type: 'application/pdf', size: 10 },
						{ name: 'c.pdf', type: 'application/pdf', size: 10 },
					],
				},
			} );

			// One entry carrying the message, not one per declined file.
			expect( mockContext.files ).toHaveLength( 2 );
			expect( mockContext.files[ 1 ] ).toMatchObject( {
				hasError: true,
				error: 'Too many files.',
			} );
		} );

		test( 'further overflow drops do not keep appending fallback entries', () => {
			// Unguarded, this reopened the very pile-up the batch work exists to end — one more
			// unsubmittable entry per drop, for as long as the visitor keeps trying.
			document.querySelector( '.jetpack-form-file-field__notice' ).remove();
			mockContext.files = [ { id: 'existing', error: null } ];

			for ( let drop = 0; drop < 4; drop++ ) {
				storeConfig.actions.fileAdded( {
					target: {
						files: [
							{ name: 'a.pdf', type: 'application/pdf', size: 10 },
							{ name: 'b.pdf', type: 'application/pdf', size: 10 },
						],
					},
				} );
			}

			expect( mockContext.files ).toHaveLength( 2 );
		} );

		test( 'the stand-in is replaceable once it is the only entry left', () => {
			// While the field is over its limit the stand-in must hold — evicting it would hand back
			// a slot the field never had. Once the real file is gone it is an ordinary occupant, and
			// protecting it there wedges the field: it cannot be evicted, no further stand-in is added
			// because one is present, and every later drop does nothing at all.
			document.querySelector( '.jetpack-form-file-field__notice' ).remove();
			mockContext.files = [ { id: 'existing', error: null } ];

			storeConfig.actions.fileAdded( {
				target: {
					files: [ { name: 'declined.pdf', type: 'application/pdf', size: 10 } ],
				},
			} );
			expect( mockContext.files ).toHaveLength( 2 );

			removeFile( 'existing' );
			expect( mockContext.files ).toHaveLength( 1 );

			storeConfig.actions.fileAdded( {
				target: { files: [ { name: 'wanted.pdf', type: 'application/pdf', size: 10 } ] },
			} );

			expect( mockContext.files ).toHaveLength( 1 );
			expect( mockContext.files[ 0 ] ).toMatchObject( { name: 'wanted.pdf', error: null } );
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

	describe( 'Upload queue', () => {
		/**
		 * Intercept uploads so a test can see which files started, and settle them by hand.
		 *
		 * Assigns over the action on the object the module destructured, which is the only handle a
		 * test has on an internal call. The real implementation still runs, so the generator can be
		 * driven to the point where it has sent.
		 *
		 * @return {Array} The uploads that have started, in order, appended to as more start.
		 */
		const interceptUploads = () => {
			const realUploadFile = storeConfig.actions.uploadFile;
			const started = [];

			storeReturns[ 'jetpack/form' ].actions.uploadFile = ( file, clientFileId ) => {
				const generator = realUploadFile( file, clientFileId );
				started.push( { clientFileId, generator } );
				return generator;
			};

			return started;
		};

		/**
		 * Offer the field a batch of acceptable files through the picker.
		 *
		 * @param {number} count - How many files to add.
		 */
		const addPdfFiles = count => {
			storeConfig.actions.fileAdded( {
				target: {
					files: Array.from( { length: count }, ( _, index ) => ( {
						name: `file-${ index }.pdf`,
						type: 'application/pdf',
						size: 10,
					} ) ),
				},
			} );
		};

		test( 'starts at most three uploads at once and holds the rest back', () => {
			// Every added file used to open its own request immediately, so a ten-file batch put ten
			// uploads on the wire at once — each starved of bandwidth, and the batch as a whole
			// finishing later than if they had gone in turn.
			mockContext.fieldExtra.maxFiles = 5;
			const started = interceptUploads();

			addPdfFiles( 5 );

			expect( started ).toHaveLength( 3 );
			expect( mockContext.files ).toHaveLength( 5 );
		} );

		test( 'starts the next queued upload when a running one is removed', () => {
			mockContext.fieldExtra.maxFiles = 5;
			const started = interceptUploads();
			addPdfFiles( 5 );

			removeFile( mockContext.files[ 0 ].id );

			expect( started ).toHaveLength( 4 );
			// The fourth file added, which is now third in the list the removal left behind.
			expect( started[ 3 ].clientFileId ).toBe( mockContext.files[ 2 ].id );
		} );

		test( 'a file removed while queued never starts', () => {
			// Nothing else takes a waiting file off the queue: it has no AbortController yet, so the
			// abort path in releaseFile() has nothing to cancel.
			mockContext.fieldExtra.maxFiles = 5;
			const started = interceptUploads();
			addPdfFiles( 5 );
			const queuedId = mockContext.files[ 4 ].id;

			removeFile( queuedId );
			expect( started ).toHaveLength( 3 );

			// Freeing a running slot now reaches past it to the file still waiting.
			removeFile( mockContext.files[ 0 ].id );

			expect( started ).toHaveLength( 4 );
			expect( started.map( entry => entry.clientFileId ) ).not.toContain( queuedId );
		} );

		test( 'a settled request frees the slot for the next queued upload', async () => {
			mockContext.fieldExtra.maxFiles = 5;
			mockTokenFetch();
			const { xhr, listeners } = installFakeXhr();
			const started = interceptUploads();

			addPdfFiles( 5 );
			expect( started ).toHaveLength( 3 );

			await drainGenerator( started[ 0 ].generator );
			listeners.readystatechange( { target: xhr } );

			expect( started ).toHaveLength( 4 );
		} );

		test( 'an upload abandoned because its file is already gone frees its slot', async () => {
			// uploadFile() bails after the token resolves if the file has been removed meanwhile. That
			// exit registers no AbortController and settles no request, so nothing else would report
			// the slot as free and the queue would run one short for the rest of the page.
			mockContext.fieldExtra.maxFiles = 5;
			mockTokenFetch();
			installFakeXhr();
			const started = interceptUploads();

			addPdfFiles( 5 );
			const abandoned = started[ 0 ];

			// Drop the entry directly, so the upload is orphaned without releaseFile() freeing it.
			mockContext.files = mockContext.files.filter( file => file.id !== abandoned.clientFileId );

			await drainGenerator( abandoned.generator );

			expect( started ).toHaveLength( 4 );
		} );
	} );

	describe( 'Upload queue resilience', () => {
		const interceptUploads = () => {
			const realUploadFile = storeConfig.actions.uploadFile;
			const started = [];

			storeReturns[ 'jetpack/form' ].actions.uploadFile = ( file, clientFileId ) => {
				const generator = realUploadFile( file, clientFileId );
				started.push( { clientFileId, generator } );
				return generator;
			};

			return started;
		};

		const addPdfFiles = count => {
			storeConfig.actions.fileAdded( {
				target: {
					files: Array.from( { length: count }, ( _, index ) => ( {
						name: `file-${ index }.pdf`,
						type: 'application/pdf',
						size: 10,
					} ) ),
				},
			} );
		};

		test( 'an aborted upload frees its slot exactly once', async () => {
			// An abort settles the request, so finishUpload runs from both releaseFile and the
			// readystatechange the abort fires. Freeing the slot twice would let the queue run over
			// the limit — which is the entire reason finishUpload is written to be idempotent.
			mockContext.fieldExtra.maxFiles = 6;
			mockTokenFetch();
			installFakeXhr();
			const started = interceptUploads();

			addPdfFiles( 6 );
			await drainGenerator( started[ 0 ].generator );

			removeFile( mockContext.files[ 0 ].id );

			// Exactly one slot freed, so exactly one queued upload started.
			expect( started ).toHaveLength( 4 );
		} );

		test( 'a stalled upload gives its slot back instead of holding it for the life of the page', async () => {
			// Without this the queue is one slot smaller for good; three stalls stop uploads on every
			// file field on the page, showing nothing but previews stuck on "Uploading…".
			jest.useFakeTimers();
			mockContext.fieldExtra.maxFiles = 6;
			mockTokenFetch();
			installFakeXhr();
			const started = interceptUploads();

			addPdfFiles( 6 );
			await drainGenerator( started[ 0 ].generator );
			expect( started ).toHaveLength( 3 );

			// No progress event ever arrives.
			jest.advanceTimersByTime( 60 * 1000 );

			expect( started ).toHaveLength( 4 );
			expect( mockContext.files[ 0 ] ).toMatchObject( { hasError: true } );
			jest.useRealTimers();
		} );

		test( 'progress keeps a slow upload alive', async () => {
			// A 20MB file on a slow connection legitimately takes minutes; only silence means hung.
			jest.useFakeTimers();
			mockTokenFetch();
			const { xhr } = installFakeXhr();
			const started = interceptUploads();

			addPdfFiles( 1 );
			await drainGenerator( started[ 0 ].generator );

			const onProgress = xhr.upload.addEventListener.mock.calls[ 0 ][ 1 ];

			for ( let tick = 0; tick < 5; tick++ ) {
				jest.advanceTimersByTime( 45 * 1000 );
				onProgress( { loaded: tick + 1, total: 100 } );
			}

			expect( mockContext.files[ 0 ].hasError ).toBeFalsy();
			expect( xhr.abort ).not.toHaveBeenCalled();
			jest.useRealTimers();
		} );

		test( 'a throw while starting the request does not leak the slot', async () => {
			mockContext.fieldExtra.maxFiles = 6;
			mockTokenFetch();
			const { xhr } = installFakeXhr();
			xhr.send.mockImplementation( () => {
				throw new Error( 'send failed' );
			} );
			const started = interceptUploads();

			addPdfFiles( 6 );
			await drainGenerator( started[ 0 ].generator );

			expect( mockContext.files[ 0 ] ).toMatchObject( { hasError: true } );
			// The slot came back, so a queued file took it.
			expect( started ).toHaveLength( 4 );
		} );

		test( 'a 200 carrying a body that is not JSON is reported as a failed upload', async () => {
			// A WAF interstitial or a PHP fatal can answer 200 with HTML. Letting SyntaxError out of
			// the handler left the file on "Uploading…" forever, which blocks submission for good.
			mockTokenFetch();
			const { xhr, listeners } = installFakeXhr();
			xhr.responseText = '<html>Blocked</html>';
			const started = interceptUploads();

			addPdfFiles( 1 );
			await drainGenerator( started[ 0 ].generator );

			expect( () => listeners.readystatechange( { target: xhr } ) ).not.toThrow();
			expect( mockContext.files[ 0 ] ).toMatchObject( {
				hasError: true,
				error: 'File upload failed, try again.',
			} );
		} );

		test( 'resetting clears queued uploads so a later batch is not blocked behind them', async () => {
			mockContext.fieldExtra.maxFiles = 6;
			mockTokenFetch();
			installFakeXhr();
			const started = interceptUploads();

			addPdfFiles( 6 );
			expect( started ).toHaveLength( 3 );

			storeConfig.actions.resetFiles();
			started.length = 0;

			addPdfFiles( 6 );

			// Three again — not fewer, which is what stale entries or unfreed slots would produce.
			expect( started ).toHaveLength( 3 );
		} );

		test( 'resetting re-validates, so an abort-time error does not outlive the files', async () => {
			// releaseFile aborts each upload, the abort settles as status 0, and that path records
			// invalid_file_has_errors against the field. Without a final updateField the files are
			// gone but the error is not: the form asks the visitor to clear file errors from a field
			// showing no files.
			mockTokenFetch();
			installFakeXhr();
			const started = interceptUploads();

			addPdfFiles( 1 );
			await drainGenerator( started[ 0 ].generator );

			mockUpdateField.mockClear();
			storeConfig.actions.resetFiles();

			const lastCall = mockUpdateField.mock.calls[ mockUpdateField.mock.calls.length - 1 ];
			expect( lastCall[ 1 ] ).toEqual( [] );
		} );

		test( 'slots are shared between file fields rather than served strictly in arrival order', () => {
			// The queue is page-wide, so a visitor who fills one field before reaching the next would
			// otherwise leave the second field's file waiting behind the whole of the first field's
			// batch — and a preview at 0% looks broken, not queued.
			const fieldA = mockContext;
			fieldA.fieldExtra.maxFiles = 6;
			const started = interceptUploads();

			addPdfFiles( 6 );
			expect( started ).toHaveLength( 3 );

			// A second field on the same page. Reassigning is enough: the getContext mock reads this
			// variable at call time. withScope is a pass-through here, so this covers slot sharing,
			// not the scope binding enqueueUpload captures.
			mockContext = {
				fieldId: 'second-file-field',
				fieldType: 'file',
				fieldExtra: { maxFiles: 1, allowedMimeTypes: ALLOWED_MIME_TYPES },
				files: [],
				isDropping: false,
				fileNotice: '',
			};

			addPdfFiles( 1 );

			// Field A releases one slot; it goes to the field with nothing running, not to A's queue.
			const queuedForB = mockContext.files[ 0 ].id;
			mockContext = fieldA;
			removeFile( fieldA.files[ 0 ].id );

			expect( started[ started.length - 1 ].clientFileId ).toBe( queuedForB );
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
		 * @param {string} fileId - The client file ID the preview is rendering.
		 * @return {{preview: HTMLElement, dropzone: HTMLElement, cleanup: Function}} The nodes and the effect cleanup the callback returned.
		 */
		const mountPreview = fileId => {
			const container = document.querySelector( '.jetpack-form-file-field__container' );
			const preview = document.createElement( 'div' );
			preview.className = 'jetpack-form-file-field__preview';
			preview.tabIndex = 0;
			container.querySelector( '.jetpack-form-file-field__preview-wrap' ).append( preview );

			const dropzone = container.querySelector( '.jetpack-form-file-field__dropzone-inner' );
			jest.spyOn( preview, 'focus' );
			jest.spyOn( dropzone, 'focus' );

			// Inside data-wp-each--file the context carries the entry the preview is rendering, which
			// is how the callback knows whether this is the file the batch nominated for focus.
			mockContext.file = { id: fileId };
			mockGetElement.mockReturnValue( { ref: preview } );

			return { preview, dropzone, cleanup: storeConfig.callbacks.focusFilePreview() };
		};

		/**
		 * Add files through the real picker path and return the resulting entries.
		 *
		 * @param {number} count - How many files to add.
		 * @return {Array} The entries now in the context.
		 */
		const addFiles = count => {
			storeConfig.actions.fileAdded( {
				target: {
					files: Array.from( { length: count }, ( _, index ) => ( {
						name: `focus-${ index }.pdf`,
						type: 'application/pdf',
						size: 10,
					} ) ),
				},
			} );

			return mockContext.files;
		};

		test( 'focuses the new preview on mount', () => {
			jest.useFakeTimers();
			const [ added ] = addFiles( 1 );
			const { preview, dropzone } = mountPreview( added.id );

			jest.runAllTimers();

			expect( preview.focus ).toHaveBeenCalledWith( { focusVisible: true } );
			expect( dropzone.focus ).not.toHaveBeenCalled();
			jest.useRealTimers();
		} );

		test( 'a preview that was not nominated never takes focus, whatever mounts first', () => {
			// A shared boolean latch could only say "nothing has claimed focus yet", so whichever
			// preview mounted first consumed it — including one left over from an earlier batch, or
			// one belonging to another file field entirely.
			jest.useFakeTimers();
			const [ first ] = addFiles( 1 );
			const stale = mountPreview( 'some-other-file' );

			jest.runAllTimers();

			expect( stale.preview.focus ).not.toHaveBeenCalled();

			// The nominated preview still gets focus when it does mount.
			const nominated = mountPreview( first.id );
			jest.runAllTimers();

			expect( nominated.preview.focus ).toHaveBeenCalledWith( { focusVisible: true } );
			jest.useRealTimers();
		} );

		test( 'returns a cleanup that hands focus back to the dropzone on removal', () => {
			// `data-wp-init` resolves the callback without invoking it, calls it once, and passes
			// the return value to useEffect as teardown — so returning a function here is how focus
			// is restored when the file is removed, not a bug.
			jest.useFakeTimers();
			const [ added ] = addFiles( 1 );
			const { preview, dropzone, cleanup } = mountPreview( added.id );
			jest.runAllTimers();

			expect( typeof cleanup ).toBe( 'function' );

			preview.remove();
			cleanup();
			jest.runAllTimers();

			expect( dropzone.focus ).toHaveBeenCalledWith( { focusVisible: true } );
			jest.useRealTimers();
		} );

		test( 'only the first file of a batch takes focus', () => {
			// data-wp-init runs once per rendered preview, so a batch used to race one 100ms timer per
			// file against the same deadline and focus whichever happened to fire last.
			jest.useFakeTimers();
			mockContext.fieldExtra.maxFiles = 3;
			const [ first, second ] = addFiles( 2 );

			const firstPreview = mountPreview( first.id );
			const secondPreview = mountPreview( second.id );

			jest.runAllTimers();

			expect( firstPreview.preview.focus ).toHaveBeenCalledWith( { focusVisible: true } );
			expect( secondPreview.preview.focus ).not.toHaveBeenCalled();
			jest.useRealTimers();
		} );

		test( 'previews mounting in any order still give focus to the nominated file', () => {
			// The runtime batches renders, so mount order follows the DOM rather than the order the
			// files were added. Naming the file rather than raising a flag is what makes that safe.
			jest.useFakeTimers();
			mockContext.fieldExtra.maxFiles = 3;
			const [ first, second ] = addFiles( 2 );

			const secondPreview = mountPreview( second.id );
			const firstPreview = mountPreview( first.id );

			jest.runAllTimers();

			expect( secondPreview.preview.focus ).not.toHaveBeenCalled();
			expect( firstPreview.preview.focus ).toHaveBeenCalledWith( { focusVisible: true } );
			jest.useRealTimers();
		} );

		test( 'a later single add takes focus again', () => {
			jest.useFakeTimers();
			mockContext.fieldExtra.maxFiles = 3;

			const [ first ] = addFiles( 1 );
			mountPreview( first.id );

			const added = addFiles( 1 );
			const second = mountPreview( added[ added.length - 1 ].id );

			jest.runAllTimers();

			expect( second.preview.focus ).toHaveBeenCalledWith( { focusVisible: true } );
			jest.useRealTimers();
		} );

		test( 'falls back to a remaining preview when the dropzone is hidden', () => {
			// The dropzone is display:none while the field is full, and a hidden element is still
			// connected — so the old isConnected check passed and focus() was a silent no-op, leaving
			// focus on <body>, which is the very thing the cleanup exists to prevent.
			jest.useFakeTimers();
			const [ added ] = addFiles( 1 );
			const { preview, dropzone, cleanup } = mountPreview( added.id );
			jest.runAllTimers();

			document.querySelector( '.jetpack-form-file-field__dropzone' ).classList.add( 'is-hidden' );

			const survivor = mountPreview( 'survivor' );
			preview.remove();
			cleanup();
			jest.runAllTimers();

			expect( dropzone.focus ).not.toHaveBeenCalled();
			expect( survivor.preview.focus ).toHaveBeenCalledWith( { focusVisible: true } );
			jest.useRealTimers();
		} );

		test( 'does not focus a preview that was removed inside the delay', () => {
			jest.useFakeTimers();
			const [ added ] = addFiles( 1 );
			const { preview, cleanup } = mountPreview( added.id );

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
