import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import TracksEditor, { uploadTrackForGuid } from '../tracks-editor';

jest.mock( '@wordpress/block-editor', () => ( {
	MediaUploadCheck: ( { children } ) => <>{ children }</>,
	store: 'core/block-editor',
} ) );

jest.mock( '@wordpress/components', () => ( {
	NavigableMenu: ( { children } ) => <div>{ children }</div>,
	MenuItem: ( { children, onClick } ) => <button onClick={ onClick }>{ children }</button>,
	FormFileUpload: ( { accept, onChange, render: renderProp, disabled } ) => (
		<>
			<input
				type="file"
				accept={ accept }
				onChange={ onChange }
				data-testid="file-input"
				disabled={ disabled }
			/>
			{ renderProp( { openFileDialog: jest.fn() } ) }
		</>
	),
	MenuGroup: ( { children, label } ) => (
		<div>
			<span>{ label }</span>
			{ children }
		</div>
	),
	ToolbarButton: ( { label, onClick } ) => <button aria-label={ label } onClick={ onClick } />,
	Dropdown: ( { renderToggle, renderContent } ) => (
		<div>
			{ renderToggle( { isOpen: true, onToggle: jest.fn() } ) }
			{ renderContent() }
		</div>
	),
	SVG: ( { children } ) => <span>{ children }</span>,
	Rect: () => <span />,
	Path: () => <span />,
	Button: ( { children, onClick, disabled } ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
	),

	TextControl: ( { label, onChange, value, help } ) => (
		<div>
			<label htmlFor={ label }>{ label }</label>
			<input id={ label } onChange={ e => onChange( e.target.value ) } value={ value } />
			{ help && <span>{ help }</span> }
		</div>
	),

	SelectControl: ( { label, options, value, onChange } ) => (
		<div>
			<label htmlFor={ label }>{ label }</label>
			<select id={ label } value={ value } onChange={ e => onChange( e.target.value ) }>
				{ options.map( o => (
					<option key={ o.value } value={ o.value }>
						{ o.label }
					</option>
				) ) }
			</select>
		</div>
	),
	Spinner: () => <div data-testid="spinner" />,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn( selector => {
		return selector( () => ( {
			getSettings: () => ( { mediaUpload: true } ),
		} ) );
	} ),
	combineReducers: jest.fn( r => r ),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: str => str,
	sprintf: ( str, ...args ) => {
		let result = str;
		args.forEach( arg => {
			result = result.replace( '%s', arg );
		} );
		return result;
	},
} ) );

jest.mock( '@wordpress/icons', () => ( {
	upload: 'upload-icon-mock',
} ) );

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

function TracksEditorWrapper( { initialTracks = [], guid = 'test-guid-123' } ) {
	const [ tracks, setTracks ] = useState( initialTracks );
	return <TracksEditor tracks={ tracks } onChange={ setTracks } guid={ guid } />;
}

describe( 'TracksEditor', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders the text tracks toolbar button', () => {
		render( <TracksEditorWrapper /> );
		expect( screen.getByLabelText( 'Text tracks' ) ).toBeInTheDocument();
	} );

	it( 'shows upload track option', () => {
		render( <TracksEditorWrapper /> );
		expect( screen.getByText( 'Upload track' ) ).toBeInTheDocument();
	} );

	it( 'displays allowed formats including .vtt and .srt', async () => {
		const user = userEvent.setup();
		render( <TracksEditorWrapper /> );
		await user.click( screen.getByText( 'Upload track' ) );

		const helpText = screen.getByText( /Allowed formats:/ );
		expect( helpText ).toHaveTextContent( /\.vtt/ );
		expect( helpText ).toHaveTextContent( /\.srt/ );
	} );

	it( 'passes both .vtt and .srt accept types to the file input', async () => {
		const user = userEvent.setup();
		render( <TracksEditorWrapper /> );
		await user.click( screen.getByText( 'Upload track' ) );

		const fileInput = screen.getByTestId( 'file-input' );
		const accept = fileInput.getAttribute( 'accept' );
		expect( accept ).toContain( '.vtt' );
		expect( accept ).toContain( 'text/vtt' );
		expect( accept ).toContain( '.srt' );
		expect( accept ).toContain( 'application/x-subrip' );
	} );
} );

describe( 'uploadTrackForGuid', () => {
	it( 'uses videoPressUploadTrack when available on window', () => {
		const mockUpload = jest.fn().mockResolvedValue( {} );
		window.videoPressUploadTrack = mockUpload;

		const track = {
			kind: 'subtitles',
			srcLang: 'en',
			label: 'English',
			tmpFile: new File( [ 'content' ], 'test.srt', { type: 'application/x-subrip' } ),
		};

		uploadTrackForGuid( track, 'test-guid' );

		expect( mockUpload ).toHaveBeenCalledWith(
			'test-guid',
			'subtitles',
			'en',
			'English',
			track.tmpFile
		);

		delete window.videoPressUploadTrack;
	} );
} );
