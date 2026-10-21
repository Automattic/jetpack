import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsTab from '../src/dashboard/settings';

const mockMutate = jest.fn();

const mockSaved = {
	podcasting_category_id: 5,
	podcasting_title: 'Show',
	podcasting_summary: '',
	podcasting_talent_name: '',
	podcasting_copyright: '',
	podcasting_email: '',
	podcasting_explicit: false,
	podcasting_image: '',
	podcasting_image_id: 0,
	podcasting_feed_limit: 10,
};

jest.mock( '../src/dashboard/hooks/use-podcast-settings', () => ( {
	usePodcastSettings: () => ( { data: mockSaved, isLoading: false } ),
	useUpdatePodcastSettings: () => ( { mutate: mockMutate, isPending: false } ),
} ) );

jest.mock( '../src/dashboard/hooks/use-validation-issues', () => ( {
	getValidationIssues: () => [],
} ) );

jest.mock( '../src/dashboard/category-picker', () => {
	const onChangeFor = onSelect => event => onSelect( Number( event.target.value ) );
	return {
		__esModule: true,
		default: ( { selectedId, onSelect } ) => (
			<select
				aria-label="Post category"
				value={ String( selectedId ) }
				onChange={ onChangeFor( onSelect ) }
			>
				<option value="5">Episodes</option>
				<option value="7">Shows</option>
				<option value="9">Talks</option>
			</select>
		),
	};
} );

jest.mock( '../src/dashboard/settings/cover-image-control', () => ( {
	__esModule: true,
	default: () => null,
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( { podcast: {} } ),
} ) );

describe( 'SettingsTab post category', () => {
	beforeEach( () => {
		mockMutate.mockReset();
	} );

	it( 'keeps the new category selected while the save is in flight', async () => {
		const user = userEvent.setup();
		render( <SettingsTab /> );

		await user.selectOptions( screen.getByRole( 'combobox', { name: 'Post category' } ), '7' );

		expect( mockMutate ).toHaveBeenCalledWith( { podcasting_category_id: 7 }, expect.anything() );
		expect( screen.getByRole( 'combobox', { name: 'Post category' } ) ).toHaveValue( '7' );
	} );

	it( 'goes back to the saved category when the save fails', async () => {
		const user = userEvent.setup();
		mockMutate.mockImplementation( ( _updates, callbacks ) =>
			callbacks?.onError?.( new Error( 'nope' ) )
		);
		render( <SettingsTab /> );

		await user.selectOptions( screen.getByRole( 'combobox', { name: 'Post category' } ), '7' );

		expect( screen.getByRole( 'combobox', { name: 'Post category' } ) ).toHaveValue( '5' );
	} );

	it( 'shows the saved category once the save succeeds', async () => {
		const user = userEvent.setup();
		mockMutate.mockImplementation( ( _updates, callbacks ) =>
			callbacks?.onSuccess?.( { ...mockSaved, podcasting_category_id: 7 } )
		);
		render( <SettingsTab /> );

		await user.selectOptions( screen.getByRole( 'combobox', { name: 'Post category' } ), '7' );

		expect( screen.getByRole( 'combobox', { name: 'Post category' } ) ).toHaveValue( '7' );
	} );

	it( 'keeps a newer pick when an older save succeeds', async () => {
		const user = userEvent.setup();
		const pending = [];
		mockMutate.mockImplementation( ( _updates, callbacks ) => pending.push( callbacks ) );
		render( <SettingsTab /> );
		const picker = screen.getByRole( 'combobox', { name: 'Post category' } );

		await user.selectOptions( picker, '7' );
		await user.selectOptions( picker, '9' );

		act( () => pending[ 0 ].onSuccess( { ...mockSaved, podcasting_category_id: 7 } ) );
		expect( picker ).toHaveValue( '9' );

		act( () => pending[ 1 ].onSuccess( { ...mockSaved, podcasting_category_id: 9 } ) );
		expect( picker ).toHaveValue( '9' );
	} );

	it( 'rolls back to the value an earlier save confirmed when a newer save fails', async () => {
		const user = userEvent.setup();
		const pending = [];
		mockMutate.mockImplementation( ( _updates, callbacks ) => pending.push( callbacks ) );
		render( <SettingsTab /> );
		const picker = screen.getByRole( 'combobox', { name: 'Post category' } );

		await user.selectOptions( picker, '7' );
		await user.selectOptions( picker, '9' );

		act( () => pending[ 0 ].onSuccess( { ...mockSaved, podcasting_category_id: 7 } ) );
		act( () => pending[ 1 ].onError( new Error( 'nope' ) ) );

		expect( picker ).toHaveValue( '7' );
	} );

	it( 'goes back to the saved category when two quick changes both fail', async () => {
		const user = userEvent.setup();
		const pending = [];
		mockMutate.mockImplementation( ( _updates, callbacks ) => pending.push( callbacks ) );
		render( <SettingsTab /> );
		const picker = screen.getByRole( 'combobox', { name: 'Post category' } );

		await user.selectOptions( picker, '7' );
		await user.selectOptions( picker, '9' );

		// The first failure must not undo the newer pick that is still saving.
		act( () => pending[ 0 ].onError( new Error( 'nope' ) ) );
		expect( picker ).toHaveValue( '9' );

		act( () => pending[ 1 ].onError( new Error( 'nope' ) ) );
		expect( picker ).toHaveValue( '5' );
	} );
} );
