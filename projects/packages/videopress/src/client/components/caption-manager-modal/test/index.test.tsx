import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaptionManagerModal from '..';
import { deleteTrackForGuid, uploadTrackForGuid } from '../../../lib/video-tracks';

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick, disabled } ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
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
	trash: 'trash',
	upload: 'upload',
} ) );

jest.mock( 'debug', () => () => jest.fn() );

jest.mock( '../../../lib/video-tracks', () => ( {
	TRACK_KIND_OPTIONS: [ 'subtitles', 'captions', 'descriptions', 'chapters', 'metadata' ],
	deleteTrackForGuid: jest.fn(),
	uploadTrackForGuid: jest.fn(),
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
	tracks,
	onClose: jest.fn(),
	onTracksChange: jest.fn(),
};

describe( 'CaptionManagerModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( uploadTrackForGuid as jest.Mock ).mockResolvedValue( 'uploaded.vtt' );
		( deleteTrackForGuid as jest.Mock ).mockResolvedValue( {} );
	} );

	it( 'lists existing tracks and preserves generated language keys for display', () => {
		render( <CaptionManagerModal { ...defaultProps } /> );

		expect( screen.getByRole( 'dialog', { name: 'Manage captions' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'English' ) ).toBeInTheDocument();
		expect( screen.getByText( 'English auto-generated' ) ).toBeInTheDocument();
		expect( screen.getByText( /auto_en/ ) ).toBeInTheDocument();
	} );

	it( 'uploads a new track with a canonicalized BCP-47 language tag', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		render(
			<CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } tracks={ [] } />
		);

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

	it( 'rejects generated language keys for manual input', async () => {
		const user = userEvent.setup();
		render( <CaptionManagerModal { ...defaultProps } tracks={ [] } /> );

		await user.type( screen.getByLabelText( 'Language' ), 'auto_en' );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'auto.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Upload track' ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Enter a valid BCP-47 language tag.' );
		expect( uploadTrackForGuid ).not.toHaveBeenCalled();
	} );

	it( 'replaces an existing track', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		( uploadTrackForGuid as jest.Mock ).mockResolvedValue( 'replacement.vtt' );
		render( <CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } /> );

		await user.click( screen.getAllByText( 'Replace' )[ 0 ] );
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

	it( 'preserves generated language keys when replacing existing tracks', async () => {
		const user = userEvent.setup();
		const onTracksChange = jest.fn();
		( uploadTrackForGuid as jest.Mock ).mockResolvedValue( 'auto-replacement.vtt' );
		render( <CaptionManagerModal { ...defaultProps } onTracksChange={ onTracksChange } /> );

		await user.click( screen.getAllByText( 'Replace' )[ 1 ] );
		await user.upload(
			screen.getByTestId( 'caption-file' ),
			new File( [ 'WEBVTT' ], 'auto-replacement.vtt', { type: 'text/vtt' } )
		);
		await user.click( screen.getByText( 'Replace track' ) );

		await waitFor( () => expect( uploadTrackForGuid ).toHaveBeenCalled() );
		expect( uploadTrackForGuid ).toHaveBeenCalledWith(
			expect.objectContaining( {
				kind: 'captions',
				srcLang: 'auto_en',
			} ),
			'abc123'
		);
		expect( onTracksChange ).toHaveBeenCalledWith( [
			tracks[ 0 ],
			expect.objectContaining( {
				kind: 'captions',
				srcLang: 'auto_en',
				src: 'auto-replacement.vtt',
			} ),
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
} );
