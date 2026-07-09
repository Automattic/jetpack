/* eslint-disable testing-library/prefer-user-event -- The mocked ComboboxControl is controlled by its value, so a single fireEvent.change is needed to replace the language instead of userEvent.type appending to it. */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaptionManagerModal from '..';
import getMediaToken from '../../../lib/get-media-token';
import {
	deleteTrackForGuid,
	fetchTrackContentForGuid,
	uploadTrackForGuid,
} from '../../../lib/video-tracks';
import {
	deleteCaptionTrack,
	fetchCaptionTracks,
	saveCaptionTrack,
} from '../../../lib/video-tracks/caption-tracks';

declare const global: typeof globalThis & { fetch: jest.MockedFunction< typeof fetch > };

let mockBlockEditorState: {
	blocks: Array< { name: string; attributes: Record< string, string >; clientId: string } >;
	onChange?: ( blocks: unknown[] ) => void;
} = { blocks: [] };

let mockDropZoneProps: { onFilesDrop?: ( files: File[] ) => void } = {};

jest.mock( '@wordpress/block-editor', () => ( {
	store: {},
	BlockEditorProvider: ( { children, onChange, value } ) => {
		mockBlockEditorState = { blocks: value, onChange };
		return <div data-testid="caption-block-editor">{ children }</div>;
	},
	BlockList: () => (
		<div>
			{ mockBlockEditorState.blocks.map( ( block, index ) => (
				<div key={ block.clientId || index }>
					<label htmlFor={ `cue-text-${ index }` }>Cue text</label>
					<textarea
						id={ `cue-text-${ index }` }
						value={ block.attributes.text ?? '' }
						onChange={ event => {
							const next = [ ...mockBlockEditorState.blocks ];
							next[ index ] = {
								...block,
								attributes: { ...block.attributes, text: event.target.value },
							};
							mockBlockEditorState.onChange?.( next );
						} }
					/>
					<label htmlFor={ `cue-start-${ index }` }>Cue start</label>
					<input
						id={ `cue-start-${ index }` }
						value={ block.attributes.startTime ?? '' }
						onChange={ event => {
							const next = [ ...mockBlockEditorState.blocks ];
							next[ index ] = {
								...block,
								attributes: { ...block.attributes, startTime: event.target.value },
							};
							mockBlockEditorState.onChange?.( next );
						} }
					/>
					<label htmlFor={ `cue-end-${ index }` }>Cue end</label>
					<input
						id={ `cue-end-${ index }` }
						value={ block.attributes.endTime ?? '' }
						onChange={ event => {
							const next = [ ...mockBlockEditorState.blocks ];
							next[ index ] = {
								...block,
								attributes: { ...block.attributes, endTime: event.target.value },
							};
							mockBlockEditorState.onChange?.( next );
						} }
					/>
				</div>
			) ) }
		</div>
	),
	BlockTools: ( { children } ) => <div>{ children }</div>,
	ObserveTyping: ( { children } ) => <div>{ children }</div>,
	WritingFlow: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/blocks', () => {
	const registry = new Map< string, unknown >();
	let blockId = 0;
	return {
		__registry: registry,
		__resetBlockMocks: () => {
			blockId = 0;
		},
		createBlock: ( name: string, attributes: Record< string, string > ) => ( {
			name,
			attributes,
			clientId: `block-${ ++blockId }`,
		} ),
		getBlockType: ( name: string ) => registry.get( name ),
		parse: ( content: string ) =>
			Array.from( content.matchAll( /<!-- wp:videopress\/caption-cue (\{.*?\}) \/-->/g ) ).map(
				( match, index ) => ( {
					name: 'videopress/caption-cue',
					attributes: JSON.parse( match[ 1 ] ),
					clientId: `parsed-${ index }`,
				} )
			),
		registerBlockType: ( name: string, settings: unknown ) => {
			registry.set( name, settings );
			return settings;
		},
		serialize: ( blocks: Array< { name: string; attributes: Record< string, string > } > ) =>
			blocks
				.map( block => `<!-- wp:${ block.name } ${ JSON.stringify( block.attributes ) } /-->` )
				.join( '\n' ),
	};
} );

jest.mock( '@wordpress/components', () => ( {
	Button: jest
		.requireActual( '@wordpress/element' )
		.forwardRef( ( { children, onClick, disabled, label }, ref ) => (
			<button ref={ ref } aria-label={ label } onClick={ onClick } disabled={ disabled }>
				{ children ?? label }
			</button>
		) ),
	DropZone: props => {
		mockDropZoneProps = props;
		return null;
	},
	ComboboxControl: ( { label, onChange, onFilterValueChange, value, help, options } ) => (
		<div>
			<label htmlFor={ label }>{ label }</label>
			<input
				id={ label }
				value={ value ?? '' }
				onChange={ event => {
					onFilterValueChange?.( event.target.value );
					onChange( event.target.value );
				} }
			/>
			<datalist data-testid={ `${ label } options` }>
				{ options?.map( option => (
					<option key={ option.value } value={ option.value }>
						{ option.label }
					</option>
				) ) }
			</datalist>
			{ help && <span>{ help }</span> }
		</div>
	),
	Disabled: ( { children } ) => <>{ children }</>,
	CheckboxControl: ( { checked, label, onChange } ) => (
		<label htmlFor="pause-while-typing">
			<input
				id="pause-while-typing"
				type="checkbox"
				checked={ checked }
				onChange={ event => onChange( event.target.checked ) }
			/>
			{ label }
		</label>
	),
	FormFileUpload: ( { accept, onChange, render: renderProp } ) => (
		<>
			<input type="file" accept={ accept } onChange={ onChange } data-testid="caption-file" />
			{ renderProp( { openFileDialog: jest.fn() } ) }
		</>
	),
	Modal: ( { children, title, onRequestClose } ) => (
		<div role="dialog" aria-label={ title }>
			<button aria-label="Close dialog" onClick={ onRequestClose }>
				Close dialog
			</button>
			{ children }
		</div>
	),
	__experimentalConfirmDialog: ( { children, isOpen, onCancel, onConfirm, confirmButtonText } ) =>
		isOpen ? (
			<div role="alertdialog">
				<p>{ children }</p>
				<button onClick={ onCancel }>Cancel</button>
				<button onClick={ onConfirm }>{ confirmButtonText }</button>
			</div>
		) : null,
	Notice: ( { children } ) => <div role="alert">{ children }</div>,
	TextareaControl: ( { label, onChange, value } ) => (
		<label htmlFor={ label }>
			{ label }
			<textarea id={ label } value={ value } onChange={ event => onChange( event.target.value ) } />
		</label>
	),
	TextControl: ( { disabled, help, label, onChange, value } ) => (
		<div>
			<label htmlFor={ label }>{ label }</label>
			<input
				id={ label }
				disabled={ disabled }
				value={ value }
				onChange={ event => onChange( event.target.value ) }
			/>
			{ help && <span>{ help }</span> }
		</div>
	),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { removeBlock: jest.fn() } ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
	_x: ( text: string ) => text,
	isRTL: () => false,
	sprintf: ( text: string, ...args: Array< number | string > ) => {
		let sequentialIndex = 0;
		return text.replace( /%(\d+\$)?[sd]/g, ( _match, position: string | undefined ) => {
			const index = position ? Number( position.replace( '$', '' ) ) - 1 : sequentialIndex++;
			return String( args[ index ] );
		} );
	},
} ) );

jest.mock( '@wordpress/icons', () => ( {
	arrowDown: 'arrow-down',
	arrowUp: 'arrow-up',
	chevronLeft: 'chevron-left',
	chevronRight: 'chevron-right',
	close: 'close',
	copy: 'copy',
	download: 'download',
	pencil: 'pencil',
	plus: 'plus',
	trash: 'trash',
	replace: 'replace',
	upload: 'upload',
} ) );

jest.mock( 'debug', () => () => jest.fn() );

jest.mock( '../../../lib/fetch-video-item', () => ( {
	fetchVideoItem: jest.fn( () => Promise.resolve( { width: 1920, height: 1080 } ) ),
} ) );

jest.mock( '../../../lib/get-media-token', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../../lib/video-tracks', () => ( {
	TRACK_KIND_OPTIONS: [ 'subtitles', 'captions', 'descriptions', 'chapters', 'metadata' ],
	CAPTION_FORMAT_MIME_TYPES: {
		'.vtt': 'text/vtt',
		'.srt': 'application/x-subrip',
		'.sbv': 'text/plain',
		'.sub': 'text/plain',
		'.mpsub': 'text/plain',
		'.lrc': 'text/plain',
		'.smi': 'application/smil+xml',
		'.sami': 'application/smil+xml',
		'.rt': 'text/vnd.rn-realtext',
		'.ttml': 'application/ttml+xml',
		'.dfxp': 'application/ttml+xml',
	},
	SUPPORTED_CAPTION_FORMATS: [
		'.vtt',
		'.srt',
		'.sbv',
		'.sub',
		'.mpsub',
		'.lrc',
		'.smi',
		'.sami',
		'.rt',
		'.ttml',
		'.dfxp',
	],
	deleteTrackForGuid: jest.fn(),
	fetchTrackContentForGuid: jest.fn(),
	flattenVideoTracks: jest.fn( () => [] ),
	normalizeVideoTextTrackResponse: jest.fn( ( response, fallback ) => ( {
		...fallback,
		...( typeof response === 'object' && response !== null ? response : {} ),
		src: typeof response === 'string' ? response : response?.src || fallback.src || '',
	} ) ),
	uploadTrackForGuid: jest.fn(),
} ) );

jest.mock( '../../../lib/video-tracks/caption-tracks', () => ( {
	CAPTION_TRACK_META: {
		guid: '_videopress_guid',
		kind: '_videopress_caption_kind',
		srcLang: '_videopress_caption_src_lang',
		label: '_videopress_caption_label',
		sourceTrackKind: '_videopress_source_track_kind',
		sourceTrackSrcLang: '_videopress_source_track_src_lang',
		sourceTrackSrc: '_videopress_source_track_src',
	},
	deleteCaptionTrack: jest.fn().mockResolvedValue( { deleted: true } ),
	fetchCaptionTracks: jest.fn().mockResolvedValue( [] ),
	getSourceTrackMeta: track =>
		track
			? {
					_videopress_source_track_kind: track.kind,
					_videopress_source_track_src_lang: track.srcLang,
					_videopress_source_track_src: track.src,
			  }
			: {},
	saveCaptionTrack: jest.fn(),
} ) );

const tracks = [
	{
		kind: 'captions' as const,
		srcLang: 'en',
		label: 'English',
		src: 'english.vtt',
	},
	{
		kind: 'captions' as const,
		srcLang: 'auto_en',
		label: 'English auto-generated',
		src: 'auto.vtt',
	},
];

const defaultProps = {
	isOpen: true,
	guid: 'abc123',
	title: 'Test video',
	videoSrc: 'video.mp4',
	poster: 'poster.jpg',
	tracks,
	onClose: jest.fn(),
	onTracksChange: jest.fn(),
};

describe( 'CaptionManagerModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.requireMock( '@wordpress/blocks' ).__resetBlockMocks();
		mockBlockEditorState = { blocks: [] };
		mockDropZoneProps = {};
		( uploadTrackForGuid as jest.Mock ).mockResolvedValue( 'uploaded.vtt' );
		( getMediaToken as jest.Mock ).mockResolvedValue( { token: 'playback-token-123' } );
		( deleteTrackForGuid as jest.Mock ).mockResolvedValue( {} );
		( fetchTrackContentForGuid as jest.Mock ).mockResolvedValue(
			'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nGenerated text'
		);
		( saveCaptionTrack as jest.Mock ).mockResolvedValue( {
			id: 77,
			title: 'English captions',
			content: '',
			status: 'draft',
			meta: {},
		} );
		Object.defineProperty( window.URL, 'createObjectURL', {
			configurable: true,
			value: jest.fn(),
			writable: true,
		} );
		Object.defineProperty( window.URL, 'revokeObjectURL', {
			configurable: true,
			value: jest.fn(),
			writable: true,
		} );
		jest
			.spyOn( window.URL, 'createObjectURL' )
			.mockImplementation()
			.mockReturnValue( 'blob:caption-track' );
		jest.spyOn( window.URL, 'revokeObjectURL' ).mockImplementation();
		global.fetch = jest.fn().mockResolvedValue( {
			ok: true,
			text: () => Promise.resolve( 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nGenerated text' ),
		} ) as jest.Mock;
	} );

	const readFile = ( file: File ) =>
		new Promise< string >( resolve => {
			const reader = new FileReader();
			reader.addEventListener( 'load', () => resolve( String( reader.result ) ) );
			reader.readAsText( file );
		} );

	const getConfirmDialog = () => screen.getByRole( 'alertdialog' );

	it( 'registers the subtitle cue block when the modal first mounts, not at import time', () => {
		expect(
			jest.requireMock( '@wordpress/blocks' ).__registry.get( 'videopress/caption-cue' )
		).toBeUndefined();

		render( <CaptionManagerModal { ...defaultProps } /> );

		expect(
			jest.requireMock( '@wordpress/blocks' ).__registry.get( 'videopress/caption-cue' )
		).toEqual(
			expect.objectContaining( {
				attributes: expect.objectContaining( {
					startTime: expect.any( Object ),
					endTime: expect.any( Object ),
					text: expect.any( Object ),
				} ),
			} )
		);
	} );

	it( 'lists existing tracks and preserves generated language keys for display', async () => {
		render( <CaptionManagerModal { ...defaultProps } /> );

		expect(
			screen.getByRole( 'dialog', { name: 'Manage subtitles for Test video' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'English' ) ).toBeInTheDocument();
		expect( screen.getByText( 'English auto-generated' ) ).toBeInTheDocument();
		expect( screen.getByText( /Auto-generated/ ) ).toBeInTheDocument();
		await waitFor( () => expect( fetchCaptionTracks ).toHaveBeenCalledWith( 'abc123' ) );
	} );

	it( 'keeps the track list when the parent re-renders with empty tracks after a refetch', async () => {
		const { rerender } = render( <CaptionManagerModal { ...defaultProps } /> );

		await waitFor( () => expect( fetchCaptionTracks ).toHaveBeenCalledWith( 'abc123' ) );
		expect( screen.getByText( 'English' ) ).toBeInTheDocument();

		// The video-details refetch hands back an empty `tracks` prop (the media
		// REST field carries no tracks); the modal's own list must stay put.
		rerender( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		expect( screen.getByText( 'English' ) ).toBeInTheDocument();
	} );

	it( 'surfaces wpcom/v2 track metadata and disables read-only or processing actions', async () => {
		render(
			<CaptionManagerModal
				{ ...defaultProps }
				tracks={ [
					{
						kind: 'captions',
						srcLang: 'en',
						label: 'English',
						src: 'english.vtt',
						source: 'manual',
						status: 'ready',
						isDraft: true,
					},
					{
						kind: 'captions',
						srcLang: 'en',
						label: 'English auto-generated',
						src: 'auto.vtt',
						source: 'asr',
						status: 'serving',
						isAutoGenerated: true,
					},
					{
						kind: 'captions',
						srcLang: 'fr',
						label: 'French',
						src: '',
						source: 'manual',
						status: 'syncing',
					},
					{
						kind: 'descriptions',
						srcLang: 'en',
						label: 'Audio descriptions',
						src: 'descriptions.vtt',
						source: 'manual',
						status: 'ready',
					},
				] }
			/>
		);

		expect( screen.getByText( /Manual.*Ready.*Draft/ ) ).toBeInTheDocument();
		expect( screen.getByText( /Auto-generated.*Ready/ ) ).toBeInTheDocument();
		expect( screen.getByText( /Manual.*Processing/ ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Audio descriptions' ) ).not.toBeInTheDocument();

		const editButtons = screen.getAllByRole( 'button', { name: 'Edit' } );
		const replaceButtons = screen.getAllByRole( 'button', { name: 'Replace file' } );
		const downloadButtons = screen.getAllByRole( 'button', { name: 'Download' } );

		expect( replaceButtons[ 0 ] ).toBeEnabled();
		// The generated English track isn't editable while the manual English track exists.
		expect( editButtons[ 1 ] ).toBeDisabled();
		expect( replaceButtons[ 1 ] ).toBeDisabled();
		expect( editButtons[ 2 ] ).toBeDisabled();
		expect( replaceButtons[ 2 ] ).toBeDisabled();
		expect( downloadButtons[ 2 ] ).toBeDisabled();
		await waitFor( () =>
			expect( screen.queryByText( /Loading subtitle tracks/ ) ).not.toBeInTheDocument()
		);
	} );

	it( 'makes Add track start the manual editor', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } /> );

		expect( screen.getByText( 'Subtitle tracks' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Upload file' ) ).not.toBeInTheDocument();

		await user.click( screen.getByText( 'Add track' ) );
		expect( screen.getByText( 'Back to tracks' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'caption-block-editor' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Cue text' ) ).toBeInTheDocument();
	} );

	it( 'undoes and redoes cue edits with the keyboard, coalescing rapid edits', async () => {
		const user = userEvent.setup();
		const nowSpy = jest.spyOn( Date, 'now' );
		render( <CaptionManagerModal { ...defaultProps } /> );

		await user.click( screen.getByText( 'Add track' ) );
		const cueText = () => screen.getByLabelText( 'Cue text' );

		/* Two edits within the coalescing window form one undo level. */
		nowSpy.mockReturnValue( 1000 );
		fireEvent.change( cueText(), { target: { value: 'One' } } );
		nowSpy.mockReturnValue( 1500 );
		fireEvent.change( cueText(), { target: { value: 'One two' } } );
		/* A later edit starts a new level. */
		nowSpy.mockReturnValue( 5000 );
		fireEvent.change( cueText(), { target: { value: 'One two three' } } );

		fireEvent.keyDown( cueText(), { key: 'z', ctrlKey: true } );
		expect( cueText() ).toHaveValue( 'One two' );

		fireEvent.keyDown( cueText(), { key: 'z', ctrlKey: true } );
		expect( cueText() ).toHaveValue( '' );

		fireEvent.keyDown( cueText(), { key: 'z', ctrlKey: true, shiftKey: true } );
		expect( cueText() ).toHaveValue( 'One two' );

		/* A fresh edit invalidates the redo stack. */
		nowSpy.mockReturnValue( 9000 );
		fireEvent.change( cueText(), { target: { value: 'One two four' } } );
		fireEvent.keyDown( cueText(), { key: 'z', ctrlKey: true, shiftKey: true } );
		expect( cueText() ).toHaveValue( 'One two four' );

		nowSpy.mockRestore();
	} );

	it( 'warns before unloading the page with unsaved cue edits', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } /> );

		const unloadEvent = () => {
			const event = new Event( 'beforeunload', { cancelable: true } );
			window.dispatchEvent( event );
			return event;
		};

		// Nothing edited yet: no warning, in the track list or a fresh editor.
		expect( unloadEvent().defaultPrevented ).toBe( false );
		await user.click( screen.getByText( 'Add track' ) );
		expect( unloadEvent().defaultPrevented ).toBe( false );

		fireEvent.change( screen.getByLabelText( 'Cue text' ), {
			target: { value: 'Unsaved cue.' },
		} );
		expect( unloadEvent().defaultPrevented ).toBe( true );
	} );

	it( 'does not expose track kind selection in the manager forms', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } /> );

		await user.click( screen.getByText( 'Add track' ) );

		expect( screen.queryByLabelText( 'Kind' ) ).not.toBeInTheDocument();

		await user.click( screen.getByText( 'Back to tracks' ) );
		await user.click( screen.getByText( 'Upload subtitle file' ) );

		expect( screen.queryByLabelText( 'Kind' ) ).not.toBeInTheDocument();
	} );

	it( 'lists saved subtitle tracks and resumes their editor content', async () => {
		const user = userEvent.setup();
		( fetchCaptionTracks as jest.Mock ).mockResolvedValueOnce( [
			{
				id: 101,
				title: 'Portuguese captions',
				content:
					'<!-- wp:videopress/caption-cue {"startTime":"00:00:03.000","endTime":"00:00:05.000","text":"Draft text."} /-->',
				status: 'draft',
				meta: {
					_videopress_guid: 'abc123',
					_videopress_caption_kind: 'captions',
					_videopress_caption_src_lang: 'pt-BR',
					_videopress_caption_label: 'Portuguese',
				},
			},
		] );

		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await expect( screen.findByText( 'Portuguese' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Draft' ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Edit' } ) );

		expect( screen.getByLabelText( 'Language' ) ).toHaveValue( 'pt-BR' );
		expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'Draft text.' );
		expect( screen.getByLabelText( 'Cue start' ) ).toHaveValue( '00:00:03.000' );
		expect( screen.getByLabelText( 'Cue end' ) ).toHaveValue( '00:00:05.000' );
	} );

	it( 'prompts before discarding unsaved cue edits and stays in the editor when cancelled', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Unsaved cue.' );
		await user.click( screen.getByText( 'Back to tracks' ) );

		expect( getConfirmDialog() ).toHaveTextContent( 'Discard unsaved subtitle changes?' );
		await user.click( within( getConfirmDialog() ).getByText( 'Cancel' ) );

		expect( screen.getByText( 'Back to tracks' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'Unsaved cue.' );
	} );

	it( 'returns to the track list when discarding unsaved cue edits is confirmed', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Unsaved cue.' );
		await user.click( screen.getByText( 'Back to tracks' ) );

		expect( getConfirmDialog() ).toHaveTextContent( 'Discard unsaved subtitle changes?' );
		await user.click( within( getConfirmDialog() ).getByText( 'Discard' ) );

		expect( screen.getByText( 'Add track' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Back to tracks' ) ).not.toBeInTheDocument();
	} );

	it( 'does not prompt when returning after only viewing a saved track', async () => {
		const user = userEvent.setup();
		( fetchCaptionTracks as jest.Mock ).mockResolvedValueOnce( [
			{
				id: 101,
				title: 'Portuguese captions',
				content:
					'<!-- wp:videopress/caption-cue {"startTime":"00:00:03.000","endTime":"00:00:05.000","text":"Draft text."} /-->',
				status: 'draft',
				meta: {
					_videopress_guid: 'abc123',
					_videopress_caption_kind: 'captions',
					_videopress_caption_src_lang: 'pt-BR',
					_videopress_caption_label: 'Portuguese',
				},
			},
		] );
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await expect( screen.findByText( 'Portuguese' ) ).resolves.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Edit' } ) );
		expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'Draft text.' );

		await user.click( screen.getByText( 'Back to tracks' ) );

		expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Add track' ) ).toBeInTheDocument();
	} );

	it( 'prompts before discarding pasted import text', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Paste transcript' ) );
		await user.type( screen.getByLabelText( 'Subtitle text' ), 'Some transcript.' );
		await user.click( screen.getByText( 'Back to tracks' ) );

		expect( getConfirmDialog() ).toHaveTextContent( 'Discard unsaved subtitle changes?' );
	} );

	it( 'prompts before closing with unsaved edits and stays open when cancelled', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } onClose={ onClose } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Unsaved cue.' );
		await user.click( screen.getByRole( 'button', { name: 'Close dialog' } ) );

		expect( getConfirmDialog() ).toHaveTextContent( 'Discard unsaved subtitle changes?' );
		await user.click( within( getConfirmDialog() ).getByText( 'Cancel' ) );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'closes with unsaved edits when the discard is confirmed', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } onClose={ onClose } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Unsaved cue.' );
		await user.click( screen.getByRole( 'button', { name: 'Close dialog' } ) );
		await user.click( within( getConfirmDialog() ).getByText( 'Discard' ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'disables manual save actions while existing track content loads', async () => {
		const user = userEvent.setup();
		let resolveContent: ( value: string ) => void = () => undefined;
		( fetchTrackContentForGuid as jest.Mock ).mockReturnValueOnce(
			new Promise< string >( resolve => {
				resolveContent = resolve;
			} )
		);
		render( <CaptionManagerModal { ...defaultProps } /> );

		await user.click( screen.getAllByText( 'Edit' )[ 0 ] );

		expect( screen.getByText( /Loading subtitle content/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Update' } ) ).toBeDisabled();

		await act( async () => {
			resolveContent( 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nLoaded text' );
			await Promise.resolve();
		} );

		await waitFor( () =>
			expect( screen.queryByText( /Loading subtitle content/ ) ).not.toBeInTheDocument()
		);
		expect( screen.getByRole( 'button', { name: 'Update' } ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'Loaded text' );
	} );

	it( 'surfaces existing track content fetch failures', async () => {
		const user = userEvent.setup();
		( fetchTrackContentForGuid as jest.Mock ).mockRejectedValueOnce( new Error( 'Network error' ) );
		render( <CaptionManagerModal { ...defaultProps } /> );

		await user.click( screen.getAllByText( 'Edit' )[ 0 ] );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Unable to load subtitle content. You can try again from the track list or start from an empty subtitle track.'
		);
	} );

	it( 'pauses the preview only while the user is actively typing', async () => {
		jest.useFakeTimers();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		try {
			render( <CaptionManagerModal { ...defaultProps } /> );
			await user.click( screen.getByText( 'Add track' ) );
			const cueText = screen.getByLabelText( 'Cue text' );
			const video = screen.getByLabelText( 'Video preview' ) as HTMLVideoElement;
			const setPaused = ( paused: boolean ) => {
				Object.defineProperty( video, 'paused', {
					configurable: true,
					value: paused,
				} );
			};
			const pause = jest.fn( () => setPaused( true ) );
			const play = jest.fn( () => {
				setPaused( false );
				return Promise.resolve();
			} );

			setPaused( false );
			Object.defineProperty( video, 'pause', { configurable: true, value: pause } );
			Object.defineProperty( video, 'play', { configurable: true, value: play } );

			await user.click( cueText );
			await user.keyboard( '{ArrowRight}' );

			expect( pause ).not.toHaveBeenCalled();

			await user.type( cueText, 'T' );

			expect( pause ).toHaveBeenCalledTimes( 1 );
			expect( play ).not.toHaveBeenCalled();

			await act( async () => {
				jest.advanceTimersByTime( 1200 );
				await Promise.resolve();
			} );

			expect( play ).toHaveBeenCalledTimes( 1 );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'controls preview playback, seeking, cue insertion, and cue jumps with keyboard shortcuts', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		const workspace = screen.getByRole( 'group', { name: 'Subtitle editing workspace' } );
		const video = screen.getByLabelText( 'Video preview' ) as HTMLVideoElement;
		const setPaused = ( paused: boolean ) => {
			Object.defineProperty( video, 'paused', {
				configurable: true,
				value: paused,
			} );
		};
		const pause = jest.fn( () => setPaused( true ) );
		const play = jest.fn( () => {
			setPaused( false );
			return Promise.resolve();
		} );

		setPaused( true );
		Object.defineProperty( video, 'pause', { configurable: true, value: pause } );
		Object.defineProperty( video, 'play', { configurable: true, value: play } );
		video.currentTime = 10;
		workspace.focus();

		await user.keyboard( '{ArrowRight}' );
		expect( video.currentTime ).toBe( 15 );

		await user.keyboard( '{ArrowLeft}' );
		expect( video.currentTime ).toBe( 10 );

		await user.keyboard( ' ' );
		expect( play ).toHaveBeenCalledTimes( 1 );

		await user.keyboard( ' ' );
		expect( pause ).toHaveBeenCalledTimes( 1 );

		await user.keyboard( 'c' );
		expect( screen.getAllByLabelText( 'Cue text' ) ).toHaveLength( 2 );
		expect( screen.getAllByLabelText( 'Cue start' )[ 1 ] ).toHaveValue( '00:00:10.000' );

		await user.clear( screen.getAllByLabelText( 'Cue text' )[ 0 ] );
		await user.type( screen.getAllByLabelText( 'Cue text' )[ 0 ], 'First cue.' );
		await user.clear( screen.getAllByLabelText( 'Cue start' )[ 0 ] );
		await user.type( screen.getAllByLabelText( 'Cue start' )[ 0 ], '00:00:01.000' );
		await user.clear( screen.getAllByLabelText( 'Cue end' )[ 0 ] );
		await user.type( screen.getAllByLabelText( 'Cue end' )[ 0 ], '00:00:05.000' );
		await user.type( screen.getAllByLabelText( 'Cue text' )[ 1 ], 'Second cue.' );
		await user.clear( screen.getAllByLabelText( 'Cue start' )[ 1 ] );
		await user.type( screen.getAllByLabelText( 'Cue start' )[ 1 ], '00:00:10.000' );
		await user.clear( screen.getAllByLabelText( 'Cue end' )[ 1 ] );
		await user.type( screen.getAllByLabelText( 'Cue end' )[ 1 ], '00:00:12.000' );

		video.currentTime = 2;
		workspace.focus();
		await user.keyboard( 'n' );
		expect( video.currentTime ).toBe( 10 );

		await user.keyboard( 'p' );
		expect( video.currentTime ).toBe( 1 );
	} );

	it( 'does not intercept shortcut keys while editing subtitle text', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		const video = screen.getByLabelText( 'Video preview' ) as HTMLVideoElement;
		video.currentTime = 10;
		await user.type( screen.getByLabelText( 'Cue text' ), 'c' );
		await user.keyboard( '{ArrowRight}' );

		expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'c' );
		expect( screen.getAllByLabelText( 'Cue text' ) ).toHaveLength( 1 );
		expect( video.currentTime ).toBe( 10 );
	} );

	it( 'imports pasted transcript text as editable cue blocks', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		// A brand-new track hides the toolbar "Paste text"; "Paste transcript" is
		// the list's dedicated entry into the same paste flow.
		await user.click( screen.getByText( 'Paste transcript' ) );
		await user.type( screen.getByLabelText( 'Subtitle text' ), 'Trail closed.\nTrail open.' );
		await user.click( screen.getByText( 'Create cues' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Subtitle text imported.' );
		expect( screen.getAllByLabelText( 'Cue text' ) ).toHaveLength( 2 );
		expect( screen.getAllByLabelText( 'Cue text' )[ 0 ] ).toHaveValue( 'Trail closed.' );
		expect( screen.getAllByLabelText( 'Cue start' )[ 0 ] ).toHaveValue( '00:00:00.000' );
		expect( screen.getAllByLabelText( 'Cue end' )[ 0 ] ).toHaveValue( '00:00:04.000' );
		expect( screen.getAllByLabelText( 'Cue text' )[ 1 ] ).toHaveValue( 'Trail open.' );
		expect( screen.getAllByLabelText( 'Cue start' )[ 1 ] ).toHaveValue( '00:00:04.000' );
		expect( screen.getAllByLabelText( 'Cue end' )[ 1 ] ).toHaveValue( '00:00:08.000' );
		expect( screen.queryByLabelText( 'Subtitle text' ) ).not.toBeInTheDocument();
	} );

	it( 'starts transcript import directly from the track list', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Paste transcript' ) );

		expect( screen.getByText( 'Back to tracks' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Subtitle text' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Language' ) ).toHaveValue( 'en' );

		await user.type( screen.getByLabelText( 'Subtitle text' ), 'Trail closed.\nTrail open.' );
		await user.click( screen.getByText( 'Create cues' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Subtitle text imported.' );
		expect( screen.getAllByLabelText( 'Cue text' ) ).toHaveLength( 2 );
		expect( screen.getAllByLabelText( 'Cue text' )[ 0 ] ).toHaveValue( 'Trail closed.' );
		expect( screen.getAllByLabelText( 'Cue text' )[ 1 ] ).toHaveValue( 'Trail open.' );
	} );

	it( 'shows the active caption cue over the preview video', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );

		const video = screen.getByLabelText( 'Video preview' ) as HTMLVideoElement;
		video.currentTime = 1;
		fireEvent.timeUpdate( video );

		expect(
			screen.getByText( 'Trail closed.', {
				selector: '.videopress-caption-manager__caption-overlay',
			} )
		).toBeInTheDocument();

		video.currentTime = 3;
		fireEvent.timeUpdate( video );

		expect(
			screen.queryByText( 'Trail closed.', {
				selector: '.videopress-caption-manager__caption-overlay',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'uploads a new track with a canonicalized BCP-47 language tag', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render(
			<CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } tracks={ [] } />
		);

		await user.click( screen.getByText( 'Upload subtitle file' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'pt-br' } } );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ '0:00:01.000,0:00:04.000\nOla' ], 'portuguese.sbv', { type: 'text/plain' } )
		);
		await user.click( screen.getByText( 'Upload track' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( uploadTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( {
				kind: 'subtitles',
				label: 'Portuguese (BR)',
				srcLang: 'pt-BR',
			} ),
			'abc123'
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				kind: 'subtitles',
				label: 'Portuguese (BR)',
				srcLang: 'pt-BR',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'starts subtitle file upload directly from the track list', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render(
			<CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } tracks={ [] } />
		);

		await user.click( screen.getByText( 'Upload subtitle file' ) );

		expect( screen.getByText( 'Upload track' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'Accepted formats: .vtt, .srt, .sbv, .sub, .mpsub, .lrc, .smi, .sami, .rt, .ttml, .dfxp'
			)
		).toBeInTheDocument();

		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'pt-br' } } );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'portuguese.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Upload track' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( uploadTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( {
				kind: 'subtitles',
				label: 'Portuguese (BR)',
				srcLang: 'pt-BR',
			} ),
			'abc123'
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				kind: 'subtitles',
				label: 'Portuguese (BR)',
				srcLang: 'pt-BR',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'keeps the video preview visible when switching to upload mode', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } /> );

		await user.click( screen.getByText( 'Add track' ) );
		expect( screen.getByLabelText( 'Video preview' ) ).toBeInTheDocument();

		await user.click( screen.getByText( 'Back to tracks' ) );
		await user.click( screen.getByText( 'Upload subtitle file' ) );

		expect( screen.getByLabelText( 'Video preview' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Upload track' ) ).toBeInTheDocument();
	} );

	it( 'uses a VideoPress player iframe for non-file preview URLs', async () => {
		const user = userEvent.setup();
		render(
			<CaptionManagerModal { ...defaultProps } videoSrc="https://videopress.com/v/abc123" />
		);

		await user.click( screen.getByText( 'Add track' ) );

		const preview = screen.getByTitle( 'Video preview' ) as HTMLIFrameElement;
		expect( preview.tagName ).toBe( 'IFRAME' );
		expect( preview.src ).toContain( 'https://videopress.com/embed/abc123' );
	} );

	it( 'shows the accepted upload formats', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Upload subtitle file' ) );

		expect( screen.getByText( /Accepted formats: \.vtt, \.srt/ ) ).toBeInTheDocument();
	} );

	it( 'shows wpcom/v2 error codes and messages from failed uploads', async () => {
		const user = userEvent.setup();
		( uploadTrackForGuid as jest.Mock ).mockResolvedValue( {
			code: 'unknown_format',
			message: 'Unsupported caption format.',
		} );
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Upload subtitle file' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'english.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Upload track' ) );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Track error: Unsupported caption format.'
		);
	} );

	it( 'rejects generated language keys for the upload language', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Upload subtitle file' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'auto_en' } } );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'auto.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Upload track' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Choose a subtitle language.' );
		expect( uploadTrackForGuid ).not.toHaveBeenCalled();
	} );

	it( 'replaces an existing track through upload mode', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		( uploadTrackForGuid as jest.Mock ).mockResolvedValue( 'replacement.vtt' );
		render( <CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } /> );

		await user.click( screen.getAllByText( 'Replace file' )[ 0 ] );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'replacement.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Replace track' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				kind: 'captions',
				srcLang: 'en',
				src: 'replacement.vtt',
			} ),
			tracks[ 1 ],
		] );
	} );

	it( 'deletes an existing track', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render( <CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } /> );

		await user.click( screen.getAllByText( 'Delete' )[ 0 ] );

		expect( getConfirmDialog() ).toHaveTextContent(
			'Delete the English subtitle track? This cannot be undone.'
		);
		await user.click( within( getConfirmDialog() ).getByText( 'Delete' ) );

		await waitFor( () =>
			expect( deleteTrackForGuid ).toHaveBeenCalledWith( tracks[ 0 ], 'abc123' )
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [ tracks[ 1 ] ] );
	} );

	it( 'does not delete when the confirmation is cancelled', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } /> );

		await user.click( screen.getAllByText( 'Delete' )[ 0 ] );
		await user.click( within( getConfirmDialog() ).getByText( 'Cancel' ) );

		expect( deleteTrackForGuid ).not.toHaveBeenCalled();
	} );

	it( 'deletes a draft caption track', async () => {
		const user = userEvent.setup();
		( fetchCaptionTracks as jest.Mock ).mockResolvedValueOnce( [
			{
				id: 202,
				title: 'Portuguese captions',
				content: '',
				status: 'draft',
				meta: {
					_videopress_guid: 'abc123',
					_videopress_caption_kind: 'captions',
					_videopress_caption_src_lang: 'pt-BR',
					_videopress_caption_label: 'Portuguese',
				},
			},
		] );
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await expect( screen.findByText( 'Portuguese' ) ).resolves.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Delete' } ) );

		expect( getConfirmDialog() ).toHaveTextContent(
			'Delete the Portuguese subtitle draft? This cannot be undone.'
		);
		await user.click( within( getConfirmDialog() ).getByText( 'Delete' ) );

		await waitFor( () => expect( deleteCaptionTrack ).toHaveBeenCalledWith( 202 ) );
		await waitFor( () => expect( screen.queryByText( 'Portuguese' ) ).not.toBeInTheDocument() );
	} );

	it( 'downloads existing track content', async () => {
		const user = userEvent.setup();
		const clickSpy = jest
			.spyOn( HTMLAnchorElement.prototype, 'click' )
			.mockImplementation( jest.fn() );

		try {
			render( <CaptionManagerModal { ...defaultProps } /> );

			await user.click( screen.getAllByText( 'Download' )[ 0 ] );

			await waitFor( () =>
				expect( fetchTrackContentForGuid ).toHaveBeenCalledWith( tracks[ 0 ], 'abc123', false )
			);
			expect( window.URL.createObjectURL ).toHaveBeenCalledWith( expect.any( Blob ) );
			expect( clickSpy ).toHaveBeenCalled();
			expect( window.URL.revokeObjectURL ).toHaveBeenCalledWith( 'blob:caption-track' );
		} finally {
			clickSpy.mockRestore();
		}
	} );

	it( 'saves a manual subtitle track with cue blocks', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Save draft' ) );

		await waitFor( () => expect( saveCaptionTrack ).toHaveBeenCalled() );
		expect( saveCaptionTrack ).toHaveBeenCalledWith(
			expect.objectContaining( {
				content: expect.stringContaining( 'wp:videopress/caption-cue' ),
				status: 'draft',
				meta: expect.objectContaining( {
					_videopress_guid: 'abc123',
					_videopress_caption_kind: 'subtitles',
					_videopress_caption_src_lang: 'en',
					_videopress_caption_label: 'English',
				} ),
			} )
		);
	} );

	it( 'publishes manual subtitles by serializing cues to WebVTT and uploading the track', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render(
			<CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } tracks={ [] } />
		);

		await user.click( screen.getByText( 'Add track' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		await waitFor( () => expect( saveCaptionTrack ).toHaveBeenCalled() );
		const uploadedTrack = ( uploadTrackForGuid as jest.Mock ).mock.calls[ 0 ][ 0 ];
		expect( uploadedTrack ).toEqual(
			expect.objectContaining( {
				kind: 'subtitles',
				label: 'English',
				srcLang: 'en',
			} )
		);
		await expect( readFile( uploadedTrack.tmpFile ) ).resolves.toContain( 'WEBVTT' );
		await expect( readFile( uploadedTrack.tmpFile ) ).resolves.toContain( 'Trail closed.' );
		expect( saveCaptionTrack ).toHaveBeenCalledWith(
			expect.objectContaining( {
				status: 'publish',
				meta: expect.objectContaining( {
					_videopress_caption_src_lang: 'en',
				} ),
			} )
		);
		expect( ( uploadTrackForGuid as jest.Mock ).mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			( saveCaptionTrack as jest.Mock ).mock.invocationCallOrder[ 0 ]
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				kind: 'subtitles',
				srcLang: 'en',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'shows a single publish notice and suppresses the inner save notice', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( saveCaptionTrack ).toHaveBeenCalled() );
		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Subtitles published.'
		);
		expect( screen.queryByText( 'Subtitle track published.' ) ).not.toBeInTheDocument();
	} );

	it( 'reports a published track whose editable copy failed to save, without the generic save error', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		( saveCaptionTrack as jest.Mock ).mockRejectedValueOnce( new Error( 'save failed' ) );
		render(
			<CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } tracks={ [] } />
		);

		await user.click( screen.getByText( 'Add track' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( saveCaptionTrack ).toHaveBeenCalled() );
		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Subtitles were published to the video, but saving the editable copy failed. Reopen the track to keep editing.'
		);
		expect( screen.queryByText( 'Unable to save subtitle track.' ) ).not.toBeInTheDocument();
		// The VTT is live despite the failed save, so the track list must reflect it.
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				kind: 'subtitles',
				srcLang: 'en',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'blocks publishing when a cue end time is before its start time', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.clear( screen.getByLabelText( 'Cue start' ) );
		await user.type( screen.getByLabelText( 'Cue start' ), '00:00:03.000' );
		await user.clear( screen.getByLabelText( 'Cue end' ) );
		await user.type( screen.getByLabelText( 'Cue end' ), '00:00:02.000' );
		await user.click( screen.getByText( 'Publish' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			'Subtitle 1 must end after it starts.'
		);
		expect( saveCaptionTrack ).not.toHaveBeenCalled();
		expect( uploadTrackForGuid ).not.toHaveBeenCalled();
	} );

	it( 'blocks publishing when subtitle cues overlap', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.type( screen.getByLabelText( 'Cue text' ), 'First cue.' );

		// Add a second cue via the keyboard shortcut (the toolbar add button was
		// replaced by the per-cue appender, which the mocked BlockList doesn't render).
		const workspace = screen.getByRole( 'group', { name: 'Subtitle editing workspace' } );
		workspace.focus();
		await user.keyboard( 'c' );

		const cueTexts = screen.getAllByLabelText( 'Cue text' );
		const cueStarts = screen.getAllByLabelText( 'Cue start' );
		const cueEnds = screen.getAllByLabelText( 'Cue end' );

		await user.clear( cueStarts[ 0 ] );
		await user.type( cueStarts[ 0 ], '00:00:01.000' );
		await user.clear( cueEnds[ 0 ] );
		await user.type( cueEnds[ 0 ], '00:00:05.000' );
		await user.type( cueTexts[ 1 ], 'Second cue.' );
		await user.clear( cueStarts[ 1 ] );
		await user.type( cueStarts[ 1 ], '00:00:04.000' );
		await user.clear( cueEnds[ 1 ] );
		await user.type( cueEnds[ 1 ], '00:00:06.000' );
		await user.click( screen.getByText( 'Publish' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Subtitle 2 overlaps subtitle 1.' );
		expect( saveCaptionTrack ).not.toHaveBeenCalled();
		expect( uploadTrackForGuid ).not.toHaveBeenCalled();
	} );

	it( 'keeps local subtitle tracks as draft when VideoPress publishing fails', async () => {
		const user = userEvent.setup();
		( fetchCaptionTracks as jest.Mock ).mockResolvedValueOnce( [
			{
				id: 101,
				title: 'Portuguese captions',
				content:
					'<!-- wp:videopress/caption-cue {"startTime":"00:00:03.000","endTime":"00:00:05.000","text":"Draft text."} /-->',
				status: 'draft',
				meta: {
					_videopress_guid: 'abc123',
					_videopress_caption_kind: 'captions',
					_videopress_caption_src_lang: 'pt-BR',
					_videopress_caption_label: 'Portuguese',
				},
			},
		] );
		( uploadTrackForGuid as jest.Mock ).mockResolvedValueOnce( {
			code: 'publish_failed',
			message: 'VideoPress rejected the subtitle file.',
		} );

		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( await screen.findByRole( 'button', { name: 'Edit' } ) );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( saveCaptionTrack ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			'Track error: VideoPress rejected the subtitle file.'
		);
	} );

	it( 'duplicates generated captions into a manual subtitle track instead of overwriting auto tracks', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render(
			<CaptionManagerModal
				{ ...defaultProps }
				tracks={ [ tracks[ 1 ] ] }
				onTracksChange={ onTracksChange }
			/>
		);

		await user.click( screen.getByText( 'Edit' ) );
		await waitFor( () =>
			expect( fetchTrackContentForGuid ).toHaveBeenCalledWith( tracks[ 1 ], 'abc123', false )
		);
		expect( screen.getByLabelText( 'Language' ) ).toHaveValue( 'en' );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		await waitFor( () => expect( saveCaptionTrack ).toHaveBeenCalled() );
		expect( saveCaptionTrack ).toHaveBeenCalledWith(
			expect.objectContaining( {
				status: 'publish',
				meta: expect.objectContaining( {
					_videopress_caption_src_lang: 'en',
					_videopress_source_track_src_lang: 'auto_en',
				} ),
			} )
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [
			tracks[ 1 ],
			expect.objectContaining( {
				kind: 'subtitles',
				srcLang: 'en',
			} ),
		] );
	} );

	it( 'disables editing generated captions once their language has a manual track', async () => {
		render( <CaptionManagerModal { ...defaultProps } /> );

		// A manual English track exists, so English edits go through that track.
		const editButtons = screen.getAllByRole( 'button', { name: 'Edit' } );
		expect( editButtons[ 0 ] ).toBeEnabled();
		expect( editButtons[ 1 ] ).toBeDisabled();
		await waitFor( () =>
			expect( screen.queryByText( /Loading subtitle tracks/ ) ).not.toBeInTheDocument()
		);
	} );

	it( 'replaces an existing track by re-uploading, without creating another', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		const tracksWithId = [ { ...tracks[ 0 ], id: 'track-1' } ];
		render(
			<CaptionManagerModal
				{ ...defaultProps }
				onTracksChange={ onTracksChange }
				tracks={ tracksWithId }
			/>
		);

		await user.click( screen.getByText( 'Replace file' ) );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'replacement.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Replace track' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( uploadTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( {
				kind: 'captions',
				srcLang: 'en',
				tmpFile: expect.any( File ),
			} ),
			'abc123'
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				id: 'track-1',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'publishes manual edits to an existing track by re-uploading', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		const tracksWithId = [ { ...tracks[ 0 ], id: 'track-1' } ];
		render(
			<CaptionManagerModal
				{ ...defaultProps }
				onTracksChange={ onTracksChange }
				tracks={ tracksWithId }
			/>
		);

		await user.click( screen.getByText( 'Edit' ) );
		await waitFor( () =>
			expect( fetchTrackContentForGuid ).toHaveBeenCalledWith( tracksWithId[ 0 ], 'abc123', false )
		);
		await user.clear( screen.getByLabelText( 'Cue text' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Updated cue.' );
		await user.click( screen.getByText( 'Update' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( uploadTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( {
				kind: 'captions',
				srcLang: 'en',
				tmpFile: expect.any( File ),
			} ),
			'abc123'
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				id: 'track-1',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'removes the previous-language track when a published track is re-published under a new language', async () => {
		const user = userEvent.setup();
		const tracksWithId = [ { ...tracks[ 0 ], id: 'track-1' } ];
		render( <CaptionManagerModal { ...defaultProps } tracks={ tracksWithId } /> );

		await user.click( screen.getByText( 'Edit' ) );
		await waitFor( () =>
			expect( fetchTrackContentForGuid ).toHaveBeenCalledWith( tracksWithId[ 0 ], 'abc123', false )
		);

		// Change the language of the English track to French and publish.
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'fr' } } );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( uploadTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( { kind: 'captions', srcLang: 'fr' } ),
			'abc123'
		);

		// The English track it replaced must be deleted so it isn't left orphaned.
		expect( deleteTrackForGuid ).toHaveBeenCalledWith(
			{ kind: 'captions', srcLang: 'en' },
			'abc123'
		);
	} );

	it( 'omits languages that already have a track from the editor’s picker, keeping the track’s own', async () => {
		const user = userEvent.setup();
		const tracksWithId = [
			{ ...tracks[ 0 ], id: 'track-1' },
			{
				kind: 'captions' as const,
				srcLang: 'es',
				label: 'Spanish',
				src: 'spanish.vtt',
				id: 'track-2',
			},
		];
		render( <CaptionManagerModal { ...defaultProps } tracks={ tracksWithId } /> );

		await user.click( screen.getAllByText( 'Edit' )[ 0 ] );
		await waitFor( () =>
			expect( fetchTrackContentForGuid ).toHaveBeenCalledWith( tracksWithId[ 0 ], 'abc123', false )
		);

		const languageOptions = within( screen.getByTestId( 'Language options' ) );
		// The other track's language is taken, so it can't be chosen…
		expect( languageOptions.queryByText( 'Spanish' ) ).not.toBeInTheDocument();
		// …while this track's own language and free languages stay selectable.
		expect( languageOptions.getByText( 'English' ) ).toBeInTheDocument();
		expect( languageOptions.getByText( 'French' ) ).toBeInTheDocument();
	} );

	it( 'omits every taken language from the picker when adding a new track', async () => {
		const user = userEvent.setup();
		const tracksWithId = [
			{ ...tracks[ 0 ], id: 'track-1' },
			{
				kind: 'captions' as const,
				srcLang: 'es',
				label: 'Spanish',
				src: 'spanish.vtt',
				id: 'track-2',
			},
		];
		render( <CaptionManagerModal { ...defaultProps } tracks={ tracksWithId } /> );

		await user.click( screen.getByText( 'Add track' ) );

		const languageOptions = within( screen.getByTestId( 'Language options' ) );
		expect( languageOptions.queryByText( 'English' ) ).not.toBeInTheDocument();
		expect( languageOptions.queryByText( 'Spanish' ) ).not.toBeInTheDocument();
		expect( languageOptions.getByText( 'French' ) ).toBeInTheDocument();
	} );

	it( 'reuses the existing caption track for a language instead of creating a duplicate', async () => {
		const user = userEvent.setup();
		( fetchCaptionTracks as jest.Mock ).mockResolvedValueOnce( [
			{
				id: 55,
				title: 'English captions',
				content: '',
				status: 'publish',
				meta: {
					_videopress_guid: 'abc123',
					_videopress_caption_kind: 'captions',
					_videopress_caption_src_lang: 'en',
					_videopress_caption_label: 'English',
				},
			},
		] );
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );
		await waitFor( () => expect( fetchCaptionTracks ).toHaveBeenCalledWith( 'abc123' ) );

		await user.click( screen.getByText( 'Add track' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.click( screen.getByRole( 'button', { name: 'Save draft' } ) );

		await waitFor( () => expect( saveCaptionTrack ).toHaveBeenCalled() );
		expect( saveCaptionTrack ).toHaveBeenCalledWith( expect.objectContaining( { id: 55 } ) );
	} );

	it( 'rejects unsupported subtitle files dropped on the modal', async () => {
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );
		await waitFor( () =>
			expect( screen.queryByText( /Loading subtitle tracks/ ) ).not.toBeInTheDocument()
		);

		act( () => {
			mockDropZoneProps.onFilesDrop?.( [
				new File( [ 'notes' ], 'notes.txt', { type: 'text/plain' } ),
			] );
		} );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( /Accepted formats: \.vtt, \.srt/ );
		expect( screen.queryByText( 'Upload track' ) ).not.toBeInTheDocument();
	} );

	it( 'guards a file drop behind the discard prompt while cue edits are unsaved', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Unsaved cue.' );

		act( () => {
			mockDropZoneProps.onFilesDrop?.( [
				new File( [ 'WEBVTT' ], 'subs.vtt', { type: 'text/vtt' } ),
			] );
		} );

		expect( getConfirmDialog() ).toHaveTextContent( 'Discard unsaved subtitle changes?' );
		await user.click( within( getConfirmDialog() ).getByText( 'Cancel' ) );

		expect( screen.queryByText( 'Upload track' ) ).not.toBeInTheDocument();
		expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'Unsaved cue.' );
	} );

	it( 'starts an upload seeded with the dropped file once the discard is confirmed', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Unsaved cue.' );

		act( () => {
			mockDropZoneProps.onFilesDrop?.( [
				new File( [ 'WEBVTT' ], 'subs.vtt', { type: 'text/vtt' } ),
			] );
		} );

		await user.click( within( getConfirmDialog() ).getByText( 'Discard' ) );

		expect( screen.getByText( 'Upload track' ) ).toBeInTheDocument();
		expect( screen.getByText( 'subs.vtt' ) ).toBeInTheDocument();
	} );

	it( 'enables Save draft only while there are unsaved edits', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		const saveButton = () => screen.getByRole( 'button', { name: 'Save draft' } );

		// A freshly opened editor has nothing to save.
		expect( saveButton() ).toBeDisabled();

		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		fireEvent.change( screen.getByLabelText( 'Cue text' ), { target: { value: 'Hello.' } } );
		expect( saveButton() ).toBeEnabled();

		// A successful save moves the baselines, so the editor is clean again.
		await user.click( saveButton() );
		await waitFor( () => expect( saveButton() ).toBeDisabled() );

		fireEvent.change( screen.getByLabelText( 'Cue text' ), { target: { value: 'Hello again.' } } );
		expect( saveButton() ).toBeEnabled();
	} );

	it( 'keeps the chosen language when a file is dropped onto the open upload form', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Upload subtitle file' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'de' } } );

		act( () => {
			mockDropZoneProps.onFilesDrop?.( [
				new File( [ 'WEBVTT' ], 'subs.vtt', { type: 'text/vtt' } ),
			] );
		} );

		expect( screen.getByText( 'subs.vtt' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Language' ) ).toHaveValue( 'de' );
	} );

	it( 'reports a failed draft save and keeps the editor dirty', async () => {
		const user = userEvent.setup();
		( saveCaptionTrack as jest.Mock ).mockRejectedValueOnce( new Error( 'save failed' ) );
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Save draft' ) );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Unable to save subtitle track.'
		);

		// The save failed, so leaving the editor must still prompt about unsaved edits.
		await user.click( screen.getByText( 'Back to tracks' ) );
		expect( getConfirmDialog() ).toHaveTextContent( 'Discard unsaved subtitle changes?' );
	} );

	it( 'surfaces a failed draft delete and keeps the draft listed', async () => {
		const user = userEvent.setup();
		( deleteCaptionTrack as jest.Mock ).mockRejectedValueOnce( new Error( 'delete failed' ) );
		( fetchCaptionTracks as jest.Mock ).mockResolvedValueOnce( [
			{
				id: 202,
				title: 'Portuguese captions',
				content: '',
				status: 'draft',
				meta: {
					_videopress_guid: 'abc123',
					_videopress_caption_kind: 'captions',
					_videopress_caption_src_lang: 'pt-BR',
					_videopress_caption_label: 'Portuguese',
				},
			},
		] );
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await expect( screen.findByText( 'Portuguese' ) ).resolves.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Delete' } ) );
		await user.click( within( getConfirmDialog() ).getByText( 'Delete' ) );

		await waitFor( () => expect( deleteCaptionTrack ).toHaveBeenCalledWith( 202 ) );
		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Unable to delete the subtitle draft.'
		);
		expect( screen.getByText( 'Portuguese' ) ).toBeInTheDocument();
	} );

	it( 'warns when the previous language’s track can’t be removed after republishing', async () => {
		const user = userEvent.setup();
		( deleteTrackForGuid as jest.Mock ).mockRejectedValueOnce( new Error( 'delete failed' ) );
		const tracksWithId = [ { ...tracks[ 0 ], id: 'track-1' } ];
		render( <CaptionManagerModal { ...defaultProps } tracks={ tracksWithId } /> );

		await user.click( screen.getByText( 'Edit' ) );
		await waitFor( () =>
			expect( fetchTrackContentForGuid ).toHaveBeenCalledWith( tracksWithId[ 0 ], 'abc123', false )
		);
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'fr' } } );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( saveCaptionTrack ).toHaveBeenCalled() );
		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Subtitles published, but the previous language’s track couldn’t be removed and may still appear.'
		);
	} );

	it( 'ignores a stale track-content fetch after switching to another track', async () => {
		const user = userEvent.setup();
		let resolveFirstTrack: ( value: string ) => void = () => undefined;
		( fetchTrackContentForGuid as jest.Mock )
			.mockReturnValueOnce(
				new Promise< string >( resolve => {
					resolveFirstTrack = resolve;
				} )
			)
			.mockResolvedValueOnce( 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nSecond track text' );
		render(
			<CaptionManagerModal
				{ ...defaultProps }
				tracks={ [
					tracks[ 0 ],
					{ kind: 'captions' as const, srcLang: 'fr', label: 'French', src: 'french.vtt' },
				] }
			/>
		);

		// Open the first track (its fetch stays pending), go back, open the second.
		await user.click( screen.getAllByText( 'Edit' )[ 0 ] );
		await user.click( screen.getByText( 'Back to tracks' ) );
		await user.click( screen.getAllByText( 'Edit' )[ 1 ] );

		await waitFor( () =>
			expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'Second track text' )
		);

		// The first track's fetch resolving late must not clobber the second track's cues.
		await act( async () => {
			resolveFirstTrack( 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nFirst track text' );
			await Promise.resolve();
		} );

		expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'Second track text' );
		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
	} );

	it( 'treats a language-only change as an unsaved edit', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		( fetchCaptionTracks as jest.Mock ).mockResolvedValueOnce( [
			{
				id: 101,
				title: 'Portuguese captions',
				content:
					'<!-- wp:videopress/caption-cue {"startTime":"00:00:03.000","endTime":"00:00:05.000","text":"Draft text."} /-->',
				status: 'draft',
				meta: {
					_videopress_guid: 'abc123',
					_videopress_caption_kind: 'captions',
					_videopress_caption_src_lang: 'pt-BR',
					_videopress_caption_label: 'Portuguese',
				},
			},
		] );
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } onClose={ onClose } /> );

		await user.click( await screen.findByRole( 'button', { name: 'Edit' } ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'fr' } } );
		await user.click( screen.getByRole( 'button', { name: 'Close dialog' } ) );

		expect( getConfirmDialog() ).toHaveTextContent( 'Discard unsaved subtitle changes?' );
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'disables Back to tracks while a publish is in flight', async () => {
		const user = userEvent.setup();
		let resolveUpload: ( value: string ) => void = () => undefined;
		( uploadTrackForGuid as jest.Mock ).mockReturnValueOnce(
			new Promise< string >( resolve => {
				resolveUpload = resolve;
			} )
		);
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		fireEvent.change( screen.getByLabelText( 'Language' ), { target: { value: 'en' } } );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Publish' ) );

		expect( screen.getByRole( 'button', { name: 'Back to tracks' } ) ).toBeDisabled();

		await act( async () => {
			resolveUpload( 'uploaded.vtt' );
			await Promise.resolve();
		} );
		await expect( screen.findByText( 'Add track' ) ).resolves.toBeInTheDocument();
	} );

	it( 'appends a playback token to the embed URL for private videos', async () => {
		const user = userEvent.setup();
		render(
			<CaptionManagerModal
				{ ...defaultProps }
				videoSrc="https://videopress.com/v/abc123"
				isPrivate
			/>
		);

		await user.click( screen.getByText( 'Add track' ) );

		const preview = ( await screen.findByTitle( 'Video preview' ) ) as HTMLIFrameElement;
		expect( getMediaToken ).toHaveBeenCalledWith( 'playback', { guid: 'abc123' } );
		expect( preview.src ).toContain( 'https://video.wordpress.com/embed/abc123' );
		expect( preview.src ).toContain( 'metadata_token=playback-token-123' );
	} );

	it( 'falls back to a tokenless embed when the playback token fetch fails', async () => {
		const user = userEvent.setup();
		( getMediaToken as jest.Mock ).mockRejectedValueOnce( new Error( 'no token' ) );
		render(
			<CaptionManagerModal
				{ ...defaultProps }
				videoSrc="https://videopress.com/v/abc123"
				isPrivate
			/>
		);

		await user.click( screen.getByText( 'Add track' ) );

		const preview = ( await screen.findByTitle( 'Video preview' ) ) as HTMLIFrameElement;
		expect( preview.src ).toContain( 'https://video.wordpress.com/embed/abc123' );
		expect( preview.src ).not.toContain( 'metadata_token' );
	} );
} );
