// Mocks must precede module imports so Jest can hoist them above the
// component file's own dependency chain (which would otherwise drag in
// the full `@wordpress/components` + admin-ui stack at test time).
/* eslint-disable testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package; fireEvent is intentional. */
const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: ( ...args ) => mockRecordEvent( ...args ) } },
} ) );

jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	ToggleControl: ( { checked, disabled, label, onChange } ) => (
		<input
			type="checkbox"
			checked={ !! checked }
			disabled={ !! disabled }
			aria-label={ label }
			onChange={ event => onChange( event.target.checked ) }
		/>
	),
} ) );

import { render, screen, fireEvent } from '@testing-library/react';
import SearchSuggestionsControl from '../index.jsx';

const defaultProps = {
	isEnabled: false,
	isInstantSearchEnabled: true,
	supportsInstantSearch: true,
	isSaving: false,
	isDisabledFromOverLimit: false,
	updateOptions: jest.fn(),
};

const getToggle = () => screen.getByRole( 'checkbox', { name: /Enable search suggestions/i } );

describe( 'SearchSuggestionsControl', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders nothing when the plan does not support instant search', () => {
		const { container } = render(
			<SearchSuggestionsControl { ...defaultProps } supportsInstantSearch={ false } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders nothing when instant search is disabled', () => {
		const { container } = render(
			<SearchSuggestionsControl { ...defaultProps } isInstantSearchEnabled={ false } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders the toggle reflecting the current stored value', () => {
		render( <SearchSuggestionsControl { ...defaultProps } isEnabled /> );

		expect( getToggle() ).toBeChecked();
	} );

	test( 'renders the toggle as off when the stored value is false', () => {
		render( <SearchSuggestionsControl { ...defaultProps } isEnabled={ false } /> );

		expect( getToggle() ).not.toBeChecked();
	} );

	test( 'dispatches a settings update and records an event when toggled', () => {
		const updateOptions = jest.fn();
		render( <SearchSuggestionsControl { ...defaultProps } updateOptions={ updateOptions } /> );

		fireEvent.click( getToggle() );

		expect( updateOptions ).toHaveBeenCalledWith( { search_suggestions_enabled: true } );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_search_suggestions_toggle', {
			search_suggestions_enabled: true,
		} );
	} );

	test( 'does not dispatch when over the usage limit', () => {
		const updateOptions = jest.fn();
		render(
			<SearchSuggestionsControl
				{ ...defaultProps }
				isEnabled
				isDisabledFromOverLimit
				updateOptions={ updateOptions }
			/>
		);

		fireEvent.click( getToggle() );

		expect( updateOptions ).not.toHaveBeenCalled();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	test( 'shows the toggle unchecked while over the usage limit even if stored on', () => {
		render( <SearchSuggestionsControl { ...defaultProps } isEnabled isDisabledFromOverLimit /> );

		const toggle = getToggle();
		expect( toggle ).not.toBeChecked();
		expect( toggle ).toBeDisabled();
	} );

	test( 'disables the toggle while settings are saving', () => {
		render( <SearchSuggestionsControl { ...defaultProps } isSaving /> );

		expect( getToggle() ).toBeDisabled();
	} );
} );
