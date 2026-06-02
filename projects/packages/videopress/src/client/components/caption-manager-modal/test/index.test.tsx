import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaptionManagerModal from '..';
import {
	deleteTrackForGuid,
	fetchTrackContentForGuid,
	fetchTracksForGuid,
	updateTrackContentForGuid,
	updateTrackForGuid,
	uploadTrackForGuid,
} from '../../../lib/video-tracks';
import { fetchCaptionDrafts, saveCaptionDraft } from '../../../lib/video-tracks/caption-drafts';

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
	sprintf: ( text: string, ...args: string[] ) => {
		let output = text;
		args.forEach( arg => {
			output = output.replace( /%[sd]/, String( arg ) );
		} );
		return output;
	},
} ) );

jest.mock( '@wordpress/icons', () => ( {
	help: 'help',
	plus: 'plus',
	trash: 'trash',
	upload: 'upload',
} ) );

jest.mock( 'debug', () => () => jest.fn() );

jest.mock( '../../../lib/video-tracks', () => ( {
	TRACK_KIND_OPTIONS: [ 'subtitles', 'captions', 'descriptions', 'chapters', 'metadata' ],
	deleteTrackForGuid: jest.fn(),
	fetchTrackContentForGuid: jest.fn(),
	fetchTracksForGuid: jest.fn(),
	normalizeVideoTextTrackResponse: jest.fn( ( response, fallback ) => ( {
		...fallback,
		...( typeof response === 'object' && response !== null ? response : {} ),
		src: typeof response === 'string' ? response : response?.src || fallback.src || '',
	} ) ),
	updateTrackContentForGuid: jest.fn(),
	updateTrackForGuid: jest.fn(),
	uploadTrackForGuid: jest.fn(),
} ) );

jest.mock( '../../../lib/video-tracks/caption-drafts', () => ( {
	CAPTION_DRAFT_META: {
		guid: '_videopress_guid',
		kind: '_videopress_caption_kind',
		srcLang: '_videopress_caption_src_lang',
		label: '_videopress_caption_label',
		sourceTrackKind: '_videopress_source_track_kind',
		sourceTrackSrcLang: '_videopress_source_track_src_lang',
		sourceTrackSrc: '_videopress_source_track_src',
	},
	fetchCaptionDrafts: jest.fn().mockResolvedValue( [] ),
	getSourceTrackMeta: track =>
		track
			? {
					_videopress_source_track_kind: track.kind,
					_videopress_source_track_src_lang: track.srcLang,
					_videopress_source_track_src: track.src,
			  }
			: {},
	saveCaptionDraft: jest.fn(),
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
		( fetchTracksForGuid as jest.Mock ).mockRejectedValue( new Error( 'Use prop tracks.' ) );
		( updateTrackContentForGuid as jest.Mock ).mockResolvedValue( {} );
		( updateTrackForGuid as jest.Mock ).mockResolvedValue( {} );
		( saveCaptionDraft as jest.Mock ).mockResolvedValue( {
			id: 77,
			title: 'English captions',
			content: '',
			status: 'draft',
			meta: {},
		} );
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
		await waitFor( () => expect( fetchCaptionDrafts ).toHaveBeenCalledWith( 'abc123' ) );
	} );

	it( 'makes Add track start the manual editor', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } /> );

		await user.click( screen.getByText( 'Upload file' ) );
		expect( screen.getByText( 'Upload caption track' ) ).toBeInTheDocument();

		await user.click( screen.getByText( 'Add track' ) );
		expect( screen.getByTestId( 'caption-block-editor' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Cue text' ) ).toBeInTheDocument();
	} );

	it( 'pauses the preview only while the user is actively typing', async () => {
		jest.useFakeTimers();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		try {
			render( <CaptionManagerModal { ...defaultProps } /> );
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

	it( 'uploads a new track with a canonicalized BCP-47 language tag', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render(
			<CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } tracks={ [] } />
		);

		await user.click( screen.getByText( 'Upload file' ) );
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

	it( 'rejects generated language keys for manual upload input', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

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

		await waitFor( () =>
			expect( deleteTrackForGuid ).toHaveBeenCalledWith( tracks[ 0 ], 'abc123' )
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [ tracks[ 1 ] ] );
	} );

	it( 'saves a manual caption draft with cue blocks', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.type( screen.getByLabelText( 'Label' ), 'English' );
		await user.type( screen.getByLabelText( 'Language' ), 'en' );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Save Draft' ) );

		await waitFor( () => expect( saveCaptionDraft ).toHaveBeenCalled() );
		expect( saveCaptionDraft ).toHaveBeenCalledWith(
			expect.objectContaining( {
				content: expect.stringContaining( 'wp:videopress/caption-cue' ),
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

		await user.type( screen.getByLabelText( 'Label' ), 'English' );
		await user.type( screen.getByLabelText( 'Language' ), 'en' );
		await user.type( screen.getByLabelText( 'Cue text' ), 'Trail closed.' );
		await user.click( screen.getByText( 'Publish' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
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
		expect( onTracksChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				kind: 'captions',
				srcLang: 'en',
				src: 'uploaded.vtt',
			} ),
		] );
	} );

	it( 'duplicates generated captions into a manual draft instead of overwriting auto tracks', async () => {
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
		expect( saveCaptionDraft ).toHaveBeenCalledWith(
			expect.objectContaining( {
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
		( fetchTracksForGuid as jest.Mock ).mockResolvedValue( remoteTracks );

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
