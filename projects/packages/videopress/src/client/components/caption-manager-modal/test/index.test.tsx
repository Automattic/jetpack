import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaptionManagerModal from '..';
import {
	deleteTrackForGuid,
	fetchTrackContentForGuid,
	fetchTrackListForGuid,
	updateTrackContentForGuid,
	updateTrackForGuid,
	uploadTrackForGuid,
} from '../../../lib/video-tracks';
import { fetchCaptionTracks, saveCaptionTrack } from '../../../lib/video-tracks/caption-tracks';

let mockBlockEditorState: {
	blocks: Array< { name: string; attributes: Record< string, string >; clientId: string } >;
	onChange?: ( blocks: unknown[] ) => void;
} = { blocks: [] };

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
	Button: ( { children, onClick, disabled } ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
	),
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
	Modal: ( { children, title } ) => (
		<div role="dialog" aria-label={ title }>
			{ children }
		</div>
	),
	Notice: ( { children } ) => <div role="alert">{ children }</div>,
	SelectControl: ( { disabled, label, onChange, options, value } ) => (
		<div>
			<label htmlFor={ label }>{ label }</label>
			<select
				id={ label }
				disabled={ disabled }
				value={ value }
				onChange={ event => onChange( event.target.value ) }
			>
				{ options.map( option => (
					<option key={ option.value } value={ option.value }>
						{ option.label }
					</option>
				) ) }
			</select>
		</div>
	),
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
	sprintf: ( text: string, ...args: Array< number | string > ) => {
		let sequentialIndex = 0;
		return text.replace( /%(\d+\$)?[sd]/g, ( _match, position: string | undefined ) => {
			const index = position ? Number( position.replace( '$', '' ) ) - 1 : sequentialIndex++;
			return String( args[ index ] );
		} );
	},
} ) );

jest.mock( '@wordpress/icons', () => ( {
	download: 'download',
	help: 'help',
	plus: 'plus',
	trash: 'trash',
	upload: 'upload',
} ) );

jest.mock( 'debug', () => () => jest.fn() );

jest.mock( '../../../lib/video-tracks', () => ( {
	TRACK_KIND_OPTIONS: [ 'subtitles', 'captions', 'descriptions', 'chapters', 'metadata' ],
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
	fetchTrackListForGuid: jest.fn(),
	hasTrackId: ( trackId: unknown ) =>
		trackId !== undefined && trackId !== null && String( trackId ) !== '',
	normalizeVideoTextTrackResponse: jest.fn( ( response, fallback ) => ( {
		...fallback,
		...( typeof response === 'object' && response !== null ? response : {} ),
		src: typeof response === 'string' ? response : response?.src || fallback.src || '',
	} ) ),
	updateTrackContentForGuid: jest.fn(),
	updateTrackForGuid: jest.fn(),
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
		( uploadTrackForGuid as jest.Mock ).mockResolvedValue( 'uploaded.vtt' );
		( deleteTrackForGuid as jest.Mock ).mockResolvedValue( {} );
		( fetchTrackContentForGuid as jest.Mock ).mockResolvedValue(
			'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nGenerated text'
		);
		( fetchTrackListForGuid as jest.Mock ).mockRejectedValue( new Error( 'Use prop tracks.' ) );
		( updateTrackContentForGuid as jest.Mock ).mockResolvedValue( {} );
		( updateTrackForGuid as jest.Mock ).mockResolvedValue( {} );
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
		jest.spyOn( window, 'confirm' ).mockImplementation().mockReturnValue( true );
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

	it( 'registers the caption cue block used by the editor', () => {
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

		expect( screen.getByRole( 'dialog', { name: 'Manage captions' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'English' ) ).toBeInTheDocument();
		expect( screen.getByText( 'English auto-generated' ) ).toBeInTheDocument();
		expect( screen.getByText( /auto_en/ ) ).toBeInTheDocument();
		await waitFor( () => expect( fetchCaptionTracks ).toHaveBeenCalledWith( 'abc123' ) );
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
				] }
			/>
		);

		expect( screen.getByText( /Manual.*Ready.*Draft/ ) ).toBeInTheDocument();
		expect( screen.getByText( /Auto-generated.*Ready/ ) ).toBeInTheDocument();
		expect( screen.getByText( /Manual.*Processing/ ) ).toBeInTheDocument();

		const editButtons = screen.getAllByRole( 'button', { name: 'Edit manually' } );
		const replaceButtons = screen.getAllByRole( 'button', { name: 'Replace file' } );
		const downloadButtons = screen.getAllByRole( 'button', { name: 'Download' } );

		expect( replaceButtons[ 0 ] ).toBeEnabled();
		expect( editButtons[ 1 ] ).toBeEnabled();
		expect( replaceButtons[ 1 ] ).toBeDisabled();
		expect( editButtons[ 2 ] ).toBeDisabled();
		expect( replaceButtons[ 2 ] ).toBeDisabled();
		expect( downloadButtons[ 2 ] ).toBeDisabled();
		await waitFor( () =>
			expect( screen.queryByText( /Loading caption tracks/ ) ).not.toBeInTheDocument()
		);
	} );

	it( 'makes Add track start the manual editor', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } /> );

		expect( screen.getByText( 'Caption tracks' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Upload file' ) ).not.toBeInTheDocument();

		await user.click( screen.getByText( 'Add track' ) );
		expect( screen.getByText( 'Back to tracks' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Upload file' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'caption-block-editor' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Cue text' ) ).toBeInTheDocument();
	} );

	it( 'lists saved caption tracks and resumes their editor content', async () => {
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

		await expect( screen.findByText( 'Local caption tracks' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Portuguese' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Captions · pt-BR · Draft' ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Edit saved track' } ) );

		expect( screen.getByLabelText( 'Language' ) ).toHaveValue( 'pt-BR' );
		expect( screen.getByLabelText( 'Label' ) ).toHaveValue( 'Portuguese' );
		expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'Draft text.' );
		expect( screen.getByLabelText( 'Cue start' ) ).toHaveValue( '00:00:03.000' );
		expect( screen.getByLabelText( 'Cue end' ) ).toHaveValue( '00:00:05.000' );
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

		await user.click( screen.getAllByText( 'Edit manually' )[ 0 ] );

		expect( screen.getByText( /Loading caption content/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Save Draft' } ) ).toBeDisabled();
		expect( screen.getByRole( 'button', { name: 'Publish' } ) ).toBeDisabled();

		await act( async () => {
			resolveContent( 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nLoaded text' );
			await Promise.resolve();
		} );

		await waitFor( () =>
			expect( screen.queryByText( /Loading caption content/ ) ).not.toBeInTheDocument()
		);
		expect( screen.getByRole( 'button', { name: 'Save Draft' } ) ).toBeEnabled();
		expect( screen.getByRole( 'button', { name: 'Publish' } ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Cue text' ) ).toHaveValue( 'Loaded text' );
	} );

	it( 'surfaces existing track content fetch failures', async () => {
		const user = userEvent.setup();
		( fetchTrackContentForGuid as jest.Mock ).mockRejectedValueOnce( new Error( 'Network error' ) );
		render( <CaptionManagerModal { ...defaultProps } /> );

		await user.click( screen.getAllByText( 'Edit manually' )[ 0 ] );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Unable to load caption content. You can try again from the track list or start from an empty caption track.'
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
		const workspace = screen.getByRole( 'group', { name: 'Caption editing workspace' } );
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

	it( 'does not intercept shortcut keys while editing caption text', async () => {
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

	it( 'reorders and duplicates cue blocks from caption order controls', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'First cue.' );
		await user.clear( screen.getByLabelText( 'Cue start' ) );
		await user.type( screen.getByLabelText( 'Cue start' ), '00:00:01.000' );
		await user.clear( screen.getByLabelText( 'Cue end' ) );
		await user.type( screen.getByLabelText( 'Cue end' ), '00:00:02.000' );
		await user.click( screen.getByText( 'Caption' ) );

		await user.type( screen.getAllByLabelText( 'Cue text' )[ 1 ], 'Second cue.' );
		await user.clear( screen.getAllByLabelText( 'Cue start' )[ 1 ] );
		await user.type( screen.getAllByLabelText( 'Cue start' )[ 1 ], '00:00:03.000' );
		await user.clear( screen.getAllByLabelText( 'Cue end' )[ 1 ] );
		await user.type( screen.getAllByLabelText( 'Cue end' )[ 1 ], '00:00:04.000' );

		await user.click( screen.getAllByRole( 'button', { name: 'Move up' } )[ 1 ] );

		expect( screen.getAllByLabelText( 'Cue text' )[ 0 ] ).toHaveValue( 'Second cue.' );
		expect( screen.getAllByLabelText( 'Cue text' )[ 1 ] ).toHaveValue( 'First cue.' );

		await user.click( screen.getAllByRole( 'button', { name: 'Duplicate' } )[ 0 ] );

		expect( screen.getAllByLabelText( 'Cue text' ) ).toHaveLength( 3 );
		expect( screen.getAllByLabelText( 'Cue text' )[ 0 ] ).toHaveValue( 'Second cue.' );
		expect( screen.getAllByLabelText( 'Cue text' )[ 1 ] ).toHaveValue( 'Second cue.' );
		expect( screen.getAllByLabelText( 'Cue text' )[ 2 ] ).toHaveValue( 'First cue.' );
		expect( screen.getAllByLabelText( 'Cue start' )[ 1 ] ).toHaveValue( '00:00:04.000' );
		expect( screen.getAllByLabelText( 'Cue end' )[ 1 ] ).toHaveValue( '00:00:05.000' );
	} );

	it( 'imports pasted transcript text as editable cue blocks', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.click( screen.getByText( 'Paste text' ) );
		await user.type( screen.getByLabelText( 'Caption text' ), 'Trail closed.\nTrail open.' );
		await user.click( screen.getByText( 'Replace cues' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Caption text imported.' );
		expect( screen.getAllByLabelText( 'Cue text' ) ).toHaveLength( 2 );
		expect( screen.getAllByLabelText( 'Cue text' )[ 0 ] ).toHaveValue( 'Trail closed.' );
		expect( screen.getAllByLabelText( 'Cue start' )[ 0 ] ).toHaveValue( '00:00:00.000' );
		expect( screen.getAllByLabelText( 'Cue end' )[ 0 ] ).toHaveValue( '00:00:04.000' );
		expect( screen.getAllByLabelText( 'Cue text' )[ 1 ] ).toHaveValue( 'Trail open.' );
		expect( screen.getAllByLabelText( 'Cue start' )[ 1 ] ).toHaveValue( '00:00:04.000' );
		expect( screen.getAllByLabelText( 'Cue end' )[ 1 ] ).toHaveValue( '00:00:08.000' );
		expect( screen.queryByLabelText( 'Caption text' ) ).not.toBeInTheDocument();
	} );

	it( 'starts transcript import directly from the track list', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Paste transcript' ) );

		expect( screen.getByText( 'Back to tracks' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Caption text' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Language' ) ).toHaveValue( '' );

		await user.type( screen.getByLabelText( 'Caption text' ), 'Trail closed.\nTrail open.' );
		await user.click( screen.getByText( 'Replace cues' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Caption text imported.' );
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

		await user.click( screen.getByText( 'Add track' ) );
		await user.click( screen.getByText( 'Upload file' ) );
		await user.type( screen.getByLabelText( 'Label' ), 'Portuguese' );
		await user.type( screen.getByLabelText( 'Language' ), 'pt-br' );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ '0:00:01.000,0:00:04.000\nOla' ], 'portuguese.sbv', { type: 'text/plain' } )
		);
		await user.click( screen.getByText( 'Upload track' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( uploadTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( {
				kind: 'captions',
				label: 'Portuguese',
				srcLang: 'pt-BR',
			} ),
			'abc123'
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				kind: 'captions',
				label: 'Portuguese',
				srcLang: 'pt-BR',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'starts caption file upload directly from the track list', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render(
			<CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } tracks={ [] } />
		);

		await user.click( screen.getByText( 'Upload caption file' ) );

		expect( screen.getByText( 'Upload caption track' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'Allowed formats: .vtt, .srt, .sbv, .sub, .mpsub, .lrc, .smi, .sami, .rt, .ttml, .dfxp'
			)
		).toBeInTheDocument();

		await user.type( screen.getByLabelText( 'Label' ), 'Portuguese' );
		await user.type( screen.getByLabelText( 'Language' ), 'pt-br' );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'portuguese.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Upload track' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( uploadTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( {
				kind: 'captions',
				label: 'Portuguese',
				srcLang: 'pt-BR',
			} ),
			'abc123'
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				kind: 'captions',
				label: 'Portuguese',
				srcLang: 'pt-BR',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'surfaces backend-provided supported upload formats', async () => {
		const user = userEvent.setup();
		( fetchTrackListForGuid as jest.Mock ).mockResolvedValue( {
			tracks: [],
			supportedFormats: [ '.vtt', '.srt' ],
		} );
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await waitFor( () => expect( fetchTrackListForGuid ).toHaveBeenCalledWith( 'abc123' ) );
		await user.click( screen.getByText( 'Add track' ) );
		await user.click( screen.getByText( 'Upload file' ) );

		expect( screen.getByText( 'Allowed formats: .vtt, .srt' ) ).toBeInTheDocument();
	} );

	it( 'shows wpcom/v2 error codes and messages from failed uploads', async () => {
		const user = userEvent.setup();
		( uploadTrackForGuid as jest.Mock ).mockResolvedValue( {
			code: 'unknown_format',
			message: 'Unsupported caption format.',
		} );
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.click( screen.getByText( 'Upload file' ) );
		await user.type( screen.getByLabelText( 'Language' ), 'en' );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'english.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Upload track' ) );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Track error: Unsupported caption format.'
		);
	} );

	it( 'rejects generated language keys for manual upload input', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.click( screen.getByText( 'Upload file' ) );
		await user.type( screen.getByLabelText( 'Language' ), 'auto_en' );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'auto.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Upload track' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Enter a valid BCP-47 language tag.' );
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

		expect( window.confirm ).toHaveBeenCalledWith(
			'Delete the English caption track? This cannot be undone.'
		);
		await waitFor( () =>
			expect( deleteTrackForGuid ).toHaveBeenCalledWith( tracks[ 0 ], 'abc123' )
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [ tracks[ 1 ] ] );
	} );

	it( 'does not delete when the confirmation is cancelled', async () => {
		const user = userEvent.setup();
		( window.confirm as jest.Mock ).mockReturnValue( false );
		render( <CaptionManagerModal { ...defaultProps } /> );

		await user.click( screen.getAllByText( 'Delete' )[ 0 ] );

		expect( deleteTrackForGuid ).not.toHaveBeenCalled();
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
				expect( fetchTrackContentForGuid ).toHaveBeenCalledWith( tracks[ 0 ], 'abc123' )
			);
			expect( window.URL.createObjectURL ).toHaveBeenCalledWith( expect.any( Blob ) );
			expect( clickSpy ).toHaveBeenCalled();
			expect( window.URL.revokeObjectURL ).toHaveBeenCalledWith( 'blob:caption-track' );
		} finally {
			clickSpy.mockRestore();
		}
	} );

	it( 'saves a manual caption track with cue blocks', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Label' ), 'English' );
		await user.type( screen.getByLabelText( 'Language' ), 'en' );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Save Draft' ) );

		await waitFor( () => expect( saveCaptionTrack ).toHaveBeenCalled() );
		expect( saveCaptionTrack ).toHaveBeenCalledWith(
			expect.objectContaining( {
				content: expect.stringContaining( 'wp:videopress/caption-cue' ),
				status: 'draft',
				meta: expect.objectContaining( {
					_videopress_guid: 'abc123',
					_videopress_caption_kind: 'captions',
					_videopress_caption_src_lang: 'en',
					_videopress_caption_label: 'English',
				} ),
			} )
		);
	} );

	it( 'publishes manual captions by serializing cues to WebVTT and uploading the track', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render(
			<CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } tracks={ [] } />
		);

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Label' ), 'English' );
		await user.type( screen.getByLabelText( 'Language' ), 'en' );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		await waitFor( () => expect( saveCaptionTrack ).toHaveBeenCalled() );
		const uploadedTrack = ( uploadTrackForGuid as jest.Mock ).mock.calls[ 0 ][ 0 ];
		expect( uploadedTrack ).toEqual(
			expect.objectContaining( {
				kind: 'captions',
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
				kind: 'captions',
				srcLang: 'en',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'blocks publishing when a cue end time is before its start time', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Label' ), 'English' );
		await user.type( screen.getByLabelText( 'Language' ), 'en' );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.clear( screen.getByLabelText( 'Cue start' ) );
		await user.type( screen.getByLabelText( 'Cue start' ), '00:00:03.000' );
		await user.clear( screen.getByLabelText( 'Cue end' ) );
		await user.type( screen.getByLabelText( 'Cue end' ), '00:00:02.000' );
		await user.click( screen.getByText( 'Publish' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			'Caption 1 must end after it starts.'
		);
		expect( saveCaptionTrack ).not.toHaveBeenCalled();
		expect( uploadTrackForGuid ).not.toHaveBeenCalled();
	} );

	it( 'blocks publishing when caption cues overlap', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( screen.getByText( 'Add track' ) );
		await user.type( screen.getByLabelText( 'Label' ), 'English' );
		await user.type( screen.getByLabelText( 'Language' ), 'en' );
		await user.type( screen.getByLabelText( 'Cue text' ), 'First cue.' );
		await user.click( screen.getByText( 'Caption' ) );

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

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Caption 2 overlaps caption 1.' );
		expect( saveCaptionTrack ).not.toHaveBeenCalled();
		expect( uploadTrackForGuid ).not.toHaveBeenCalled();
	} );

	it( 'keeps local caption tracks as draft when VideoPress publishing fails', async () => {
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
			message: 'VideoPress rejected the caption file.',
		} );

		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.click( await screen.findByRole( 'button', { name: 'Edit saved track' } ) );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( saveCaptionTrack ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			'Track error: VideoPress rejected the caption file.'
		);
	} );

	it( 'duplicates generated captions into a manual caption track instead of overwriting auto tracks', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render( <CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } /> );

		await user.click( screen.getAllByText( 'Edit manually' )[ 1 ] );
		await waitFor( () =>
			expect( fetchTrackContentForGuid ).toHaveBeenCalledWith( tracks[ 1 ], 'abc123' )
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
			expect.objectContaining( {
				kind: 'captions',
				srcLang: 'en',
			} ),
			tracks[ 1 ],
		] );
	} );

	it( 'uses the refreshed wpcom/v2 track list when deleting tracks', async () => {
		const user = userEvent.setup();
		const remoteTracks = [ { ...tracks[ 0 ], id: 'track-1', src: 'api-english.vtt' } ];
		( fetchTrackListForGuid as jest.Mock ).mockResolvedValue( {
			tracks: remoteTracks,
			supportedFormats: [ '.vtt', '.srt' ],
		} );

		render( <CaptionManagerModal { ...defaultProps } /> );

		await waitFor( () =>
			expect( screen.queryByText( 'English auto-generated' ) ).not.toBeInTheDocument()
		);
		await user.click( screen.getByText( 'Delete' ) );

		await waitFor( () =>
			expect( deleteTrackForGuid ).toHaveBeenCalledWith( remoteTracks[ 0 ], 'abc123' )
		);
	} );

	it( 'replaces existing wpcom/v2 track content without creating another track', async () => {
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

		await waitFor( () => expect( updateTrackContentForGuid ).toHaveBeenCalled() );
		expect( updateTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( {
				id: 'track-1',
				kind: 'captions',
				srcLang: 'en',
			} ),
			'abc123'
		);
		expect( updateTrackContentForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 'track-1' } ),
			'abc123',
			expect.any( File )
		);
		expect( uploadTrackForGuid ).not.toHaveBeenCalled();
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				id: 'track-1',
				src: 'english.vtt',
			} ),
		] );
	} );

	it( 'publishes manual edits to existing wpcom/v2 track content', async () => {
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

		await user.click( screen.getByText( 'Edit manually' ) );
		await waitFor( () =>
			expect( fetchTrackContentForGuid ).toHaveBeenCalledWith( tracksWithId[ 0 ], 'abc123' )
		);
		await user.clear( screen.getByLabelText( 'Cue text' ) );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Updated cue.' );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( updateTrackContentForGuid ).toHaveBeenCalled() );
		expect( updateTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( {
				id: 'track-1',
				kind: 'captions',
				srcLang: 'en',
			} ),
			'abc123'
		);
		expect( updateTrackContentForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 'track-1' } ),
			'abc123',
			expect.stringContaining( 'Updated cue.' )
		);
		expect( uploadTrackForGuid ).not.toHaveBeenCalled();
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				id: 'track-1',
				src: 'english.vtt',
			} ),
		] );
	} );
} );
