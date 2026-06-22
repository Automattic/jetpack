import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getBlockType, unregisterBlockType } from '@wordpress/blocks';
import { CAPTION_CUE_BLOCK_NAME } from '../../../lib/video-tracks/cues';
import { registerCaptionCueBlock } from '../caption-cue-block';

const mockRemoveBlock = jest.fn();

jest.mock( '@wordpress/block-editor', () => ( { store: {} } ) );

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
	};
} );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, label, onClick } ) => (
		<button aria-label={ label } onClick={ onClick }>
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
	useDispatch: () => ( { removeBlock: mockRemoveBlock } ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
} ) );

jest.mock( '@wordpress/icons', () => ( { trash: 'trash' } ) );

afterEach( () => {
	mockRemoveBlock.mockClear();
	if ( getBlockType( CAPTION_CUE_BLOCK_NAME ) ) {
		unregisterBlockType( CAPTION_CUE_BLOCK_NAME );
	}
} );

describe( 'registerCaptionCueBlock', () => {
	it( 'registers the caption cue block with its default attributes', () => {
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

	it( 'renders the cue fields with their current values', () => {
		setup();

		expect( screen.getByLabelText( 'Caption' ) ).toHaveValue( 'Hello' );
		expect( screen.getByLabelText( 'Start' ) ).toHaveValue( '00:00:00.000' );
		expect( screen.getByLabelText( 'End' ) ).toHaveValue( '00:00:02.000' );
	} );

	it( 'updates the caption text on change', async () => {
		const { setAttributes } = setup( { text: '' } );

		await userEvent.type( screen.getByLabelText( 'Caption' ), 'A' );

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

	it( 'removes the block when the delete button is clicked', async () => {
		setup();

		await userEvent.click( screen.getByLabelText( 'Delete cue' ) );

		expect( mockRemoveBlock ).toHaveBeenCalledWith( 'cue-1' );
	} );
} );
