import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import TrackForm from '../track-form';

jest.mock( '@wordpress/block-editor', () => ( {
	MediaUploadCheck: ( { children } ) => <>{ children }</>,
	store: 'core/block-editor',
} ) );

jest.mock( '@wordpress/components', () => ( {
	FormFileUpload: ( { accept, onChange, render: renderProp } ) => {
		return (
			<>
				<input type="file" accept={ accept } onChange={ onChange } data-testid="file-input" />
				{ renderProp( {
					openFileDialog: jest.fn(),
				} ) }
			</>
		);
	},
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
	MenuGroup: ( { children, label } ) => (
		<div>
			<span>{ label }</span>
			{ children }
		</div>
	),
	ToggleControl: ( { label, checked, onChange } ) => (
		// eslint-disable-next-line jsx-a11y/label-has-associated-control -- test mock
		<label>
			<input type="checkbox" checked={ checked } onChange={ () => onChange( ! checked ) } />
			{ label }
		</label>
	),
	Notice: ( { children } ) => <div role="alert">{ children }</div>,
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
	__: ( str: string ) => str,
	sprintf: ( str: string, ...args: string[] ) => {
		let result = str;
		args.forEach( arg => {
			result = result.replace( '%s', arg );
		} );
		return result;
	},
} ) );

jest.mock( 'debug', () => () => jest.fn() );

const defaultProps = {
	onCancel: jest.fn(),
	onSave: jest.fn(),
	tracks: [],
	errorMessage: '',
};

describe( 'TrackForm', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders the form', () => {
		render( <TrackForm { ...defaultProps } /> );
		expect( screen.getByText( 'Upload track' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Select track' ) ).toBeInTheDocument();
	} );

	it( 'displays allowed formats including .vtt and .srt', () => {
		render( <TrackForm { ...defaultProps } /> );
		const helpText = screen.getByText( /Allowed formats:/ );
		expect( helpText ).toHaveTextContent( /\.vtt/ );
		expect( helpText ).toHaveTextContent( /\.srt/ );
	} );

	it( 'passes both .vtt and .srt accept types to the file input', () => {
		render( <TrackForm { ...defaultProps } /> );
		const fileInput = screen.getByTestId( 'file-input' );
		const accept = fileInput.getAttribute( 'accept' );
		expect( accept ).toContain( '.vtt' );
		expect( accept ).toContain( 'text/vtt' );
		expect( accept ).toContain( '.srt' );
		expect( accept ).toContain( 'application/x-subrip' );
	} );

	it( 'returns null when mediaUpload is not available', () => {
		const mockedUseSelect = useSelect as jest.Mock;
		const original = mockedUseSelect.getMockImplementation();
		mockedUseSelect.mockImplementation( selector => {
			return selector( () => ( {
				getSettings: () => ( { mediaUpload: null } ),
			} ) );
		} );

		const { container } = render( <TrackForm { ...defaultProps } /> );
		expect( container ).toBeEmptyDOMElement();

		mockedUseSelect.mockImplementation( original );
	} );

	it( 'disables the Save button when no file is selected', () => {
		render( <TrackForm { ...defaultProps } /> );
		expect( screen.getByText( 'Save' ) ).toBeDisabled();
	} );

	it( 'calls onCancel when Cancel is clicked', async () => {
		const user = userEvent.setup();
		render( <TrackForm { ...defaultProps } /> );

		await user.click( screen.getByText( 'Cancel' ) );
		expect( defaultProps.onCancel ).toHaveBeenCalled();
	} );

	it( 'displays an error message from props', () => {
		render( <TrackForm { ...defaultProps } errorMessage="Upload failed" /> );
		expect( screen.getByText( 'Upload failed' ) ).toBeInTheDocument();
	} );
} );
