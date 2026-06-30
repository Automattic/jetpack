import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getBlockType, unregisterBlockType } from '@wordpress/blocks';
import { CAPTION_CUE_BLOCK_NAME } from '../../../lib/video-tracks/cues';
import { registerCaptionCueBlock, setCurrentCueVideoTime } from '../caption-cue-block';

const mockInsertBlock = jest.fn();
const mockMoveBlocksUp = jest.fn();
const mockMoveBlocksDown = jest.fn();
const mockRemoveBlock = jest.fn();

let mockSelectState = { index: 0, count: 1, rootClientId: undefined as string | undefined };

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
	useBlockProps: ( props = {} ) => props,
} ) );

jest.mock( '@wordpress/blocks', () => {
	const registry = new Map< string, unknown >();
	return {
		getBlockType: ( name: string ) => registry.get( name ),
		registerBlockType: ( name: string, settings: Record< string, unknown > ) => {
			const blockType = { name, ...settings };
			registry.set( name, blockType );
			return blockType;
		},
		unregisterBlockType: ( name: string ) => {
			registry.delete( name );
		},
		createBlock: ( name: string, attributes: Record< string, unknown > = {} ) => ( {
			name,
			attributes,
		} ),
	};
} );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, label, onClick, disabled } ) => (
		<button aria-label={ label } onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
	),
	TextareaControl: ( { label, onChange, value } ) => (
		<div>
			<label htmlFor={ label }>{ label }</label>
			<textarea id={ label } value={ value } onChange={ event => onChange( event.target.value ) } />
		</div>
	),
	TextControl: ( { label, onBlur, onChange, value } ) => (
		<div>
			<label htmlFor={ label }>{ label }</label>
			<input
				id={ label }
				value={ value }
				onChange={ event => onChange( event.target.value ) }
				onBlur={ onBlur }
			/>
		</div>
	),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		insertBlock: mockInsertBlock,
		moveBlocksUp: mockMoveBlocksUp,
		moveBlocksDown: mockMoveBlocksDown,
		removeBlock: mockRemoveBlock,
	} ),
	useSelect: () => mockSelectState,
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
	sprintf: ( format: string, ...args: unknown[] ) => {
		let index = 0;
		return format.replace( /%[ds]/g, () => String( args[ index++ ] ) );
	},
} ) );

jest.mock( '@wordpress/icons', () => ( {
	arrowDown: 'arrowDown',
	arrowUp: 'arrowUp',
	copy: 'copy',
	plus: 'plus',
	trash: 'trash',
} ) );

beforeEach( () => {
	mockSelectState = { index: 0, count: 1, rootClientId: undefined };
} );

afterEach( () => {
	mockInsertBlock.mockClear();
	mockMoveBlocksUp.mockClear();
	mockMoveBlocksDown.mockClear();
	mockRemoveBlock.mockClear();
	if ( getBlockType( CAPTION_CUE_BLOCK_NAME ) ) {
		unregisterBlockType( CAPTION_CUE_BLOCK_NAME );
	}
} );

describe( 'registerCaptionCueBlock', () => {
	it( 'registers the subtitle cue block with its default attributes', () => {
		const blockType = registerCaptionCueBlock();

		expect( blockType?.name ).toBe( CAPTION_CUE_BLOCK_NAME );
		expect( blockType?.attributes ).toMatchObject( {
			startTime: { default: '00:00:00.000' },
			endTime: { default: '00:00:02.000' },
			text: { default: '' },
		} );
	} );

	it( 'returns the existing block type when already registered', () => {
		const first = registerCaptionCueBlock();
		const second = registerCaptionCueBlock();

		expect( second ).toBe( getBlockType( CAPTION_CUE_BLOCK_NAME ) );
		expect( second?.name ).toBe( first?.name );
	} );

	it( 'saves no markup for the cue block', () => {
		expect( registerCaptionCueBlock().save() ).toBeNull();
	} );
} );

describe( 'CaptionCueEdit', () => {
	const setup = ( attributes = {} ) => {
		const setAttributes = jest.fn();
		const Edit = registerCaptionCueBlock().edit;
		render(
			<Edit
				attributes={ {
					startTime: '00:00:00.000',
					endTime: '00:00:02.000',
					text: 'Hello',
					...attributes,
				} }
				clientId="cue-1"
				setAttributes={ setAttributes }
			/>
		);
		return { setAttributes };
	};

	it( 'renders the cue number and fields with their current values', () => {
		mockSelectState = { index: 1, count: 3, rootClientId: undefined };
		setup();

		expect( screen.getByText( 'Subtitle 2' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Subtitle' ) ).toHaveValue( 'Hello' );
		expect( screen.getByLabelText( 'Start' ) ).toHaveValue( '00:00:00.000' );
		expect( screen.getByLabelText( 'End' ) ).toHaveValue( '00:00:02.000' );
	} );

	it( 'updates the subtitle text on change', async () => {
		const { setAttributes } = setup( { text: '' } );

		await userEvent.type( screen.getByLabelText( 'Subtitle' ), 'A' );

		expect( setAttributes ).toHaveBeenCalledWith( { text: 'A' } );
	} );

	it( 'updates the start and end times on change', async () => {
		const { setAttributes } = setup( { startTime: '', endTime: '' } );

		await userEvent.type( screen.getByLabelText( 'Start' ), '1' );
		await userEvent.type( screen.getByLabelText( 'End' ), '2' );

		expect( setAttributes ).toHaveBeenCalledWith( { startTime: '1' } );
		expect( setAttributes ).toHaveBeenCalledWith( { endTime: '2' } );
	} );

	it( 'normalizes the start timestamp on blur', () => {
		const { setAttributes } = setup( { startTime: '1:2.5' } );

		fireEvent.blur( screen.getByLabelText( 'Start' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { startTime: '00:01:02.500' } );
	} );

	it( 'keeps the original end timestamp when it cannot be normalized', () => {
		const { setAttributes } = setup( { endTime: 'not-a-time' } );

		fireEvent.blur( screen.getByLabelText( 'End' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { endTime: 'not-a-time' } );
	} );

	it( 'disables move up for the first cue and moves down otherwise', async () => {
		mockSelectState = { index: 0, count: 2, rootClientId: undefined };
		setup();

		expect( screen.getByLabelText( 'Move up' ) ).toBeDisabled();

		await userEvent.click( screen.getByLabelText( 'Move down' ) );

		expect( mockMoveBlocksDown ).toHaveBeenCalledWith( [ 'cue-1' ], undefined );
	} );

	it( 'moves the cue up when not the first cue', async () => {
		mockSelectState = { index: 1, count: 2, rootClientId: undefined };
		setup();

		await userEvent.click( screen.getByLabelText( 'Move up' ) );

		expect( mockMoveBlocksUp ).toHaveBeenCalledWith( [ 'cue-1' ], undefined );
	} );

	it( 'duplicates the cue after itself with its text and shifted times', async () => {
		setup();

		await userEvent.click( screen.getByLabelText( 'Duplicate' ) );

		expect( mockInsertBlock ).toHaveBeenCalledWith(
			{
				name: CAPTION_CUE_BLOCK_NAME,
				attributes: { startTime: '00:00:02.000', endTime: '00:00:04.000', text: 'Hello' },
			},
			1,
			undefined,
			false
		);
	} );

	it( 'inserts a cue below at the current playback time', async () => {
		setCurrentCueVideoTime( 5 );
		setup();

		await userEvent.click( screen.getByLabelText( 'Add subtitle below' ) );

		expect( mockInsertBlock ).toHaveBeenCalledWith(
			{
				name: CAPTION_CUE_BLOCK_NAME,
				attributes: { startTime: '00:00:05.000', endTime: '00:00:07.000' },
			},
			1,
			undefined,
			false
		);
	} );

	it( 'removes the block when the delete button is clicked', async () => {
		setup();

		await userEvent.click( screen.getByLabelText( 'Delete subtitle' ) );

		expect( mockRemoveBlock ).toHaveBeenCalledWith( 'cue-1' );
	} );
} );
