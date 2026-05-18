import { fetchSuggestionsFromApi } from '../api';
import { enhanceSearchInput } from '../enhance-input';

jest.mock( '../api', () => ( {
	fetchSuggestionsFromApi: jest.fn(),
} ) );

describe( 'enhanceSearchInput', () => {
	let input;
	let container;

	beforeEach( () => {
		document.body.innerHTML = '<div id="container"><input type="search" /></div>';
		container = document.getElementById( 'container' );
		input = container.querySelector( 'input' );
		fetchSuggestionsFromApi.mockResolvedValue( [ { type: 'query', text: 'wordpress hooks' } ] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
		document.body.innerHTML = '';
	} );

	test( 'renders suggestions and selects query suggestions', async () => {
		const onQuerySelect = jest.fn();
		enhanceSearchInput( {
			input,
			container,
			siteId: '123',
			apiOptions: {},
			onQuerySelect,
			onNavigate: jest.fn(),
		} );

		input.value = 'word';
		input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
		await Promise.resolve();
		await Promise.resolve();

		container.querySelector( '.jetpack-instant-search__search-suggestion' ).click();

		expect( onQuerySelect ).toHaveBeenCalledWith( { type: 'query', text: 'wordpress hooks' } );
		expect( input.value ).toBe( 'wordpress hooks' );
	} );

	test( 'calls onSubmit when Enter is pressed without an active suggestion', () => {
		const onSubmit = jest.fn();
		enhanceSearchInput( {
			input,
			container,
			siteId: '123',
			apiOptions: {},
			onQuerySelect: jest.fn(),
			onNavigate: jest.fn(),
			onSubmit,
		} );

		input.value = 'plain query';
		input.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Enter', bubbles: true } ) );

		expect( onSubmit ).toHaveBeenCalledWith( 'plain query' );
	} );
} );
