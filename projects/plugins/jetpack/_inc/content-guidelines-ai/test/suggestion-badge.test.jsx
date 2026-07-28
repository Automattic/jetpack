import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import SuggestionBadge from '../components/suggestion-badge';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );
jest.mock( '@wordpress/components', () => ( {
	Spinner: () => <span data-testid="cg-spinner" />,
} ) );
jest.mock( '@wordpress/ui', () => ( {
	Badge: ( { children } ) => <span>{ children }</span>,
} ) );

function mockStore( { loading = false, has = false } ) {
	const selectors = {
		isSectionLoading: () => loading,
		hasSuggestion: () => has,
	};
	useSelect.mockImplementation( map => map( () => selectors ) );
}

describe( 'SuggestionBadge', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'shows a spinner while loading with no suggestion yet', () => {
		mockStore( { loading: true, has: false } );
		render( <SuggestionBadge slug="copy" /> );

		expect( screen.getByTestId( 'cg-spinner' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Suggestion' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the Suggestion badge once a suggestion exists', () => {
		mockStore( { loading: false, has: true } );
		render( <SuggestionBadge slug="copy" /> );

		expect( screen.getByText( 'Suggestion' ) ).toBeInTheDocument();
	} );

	it( 'prefers the badge over the spinner when both loading and a suggestion are present', () => {
		mockStore( { loading: true, has: true } );
		render( <SuggestionBadge slug="copy" /> );

		expect( screen.getByText( 'Suggestion' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'cg-spinner' ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing when idle with no suggestion', () => {
		mockStore( { loading: false, has: false } );
		const { container } = render( <SuggestionBadge slug="copy" /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
