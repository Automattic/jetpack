/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import CriticalCssAdvancedCards from './critical-css-advanced-cards';

jest.mock( '$features/critical-css/recommendations/use-recommendations', () => ( {
	useRecommendations: () => mockRecommendations,
	getErrorSets: ( r: { errors: { type: string }[] } ) =>
		r.errors.map( e => ( { type: e.type, firstMeta: {}, byUrl: {} } ) ),
} ) );
jest.mock( '$features/critical-css/error-description/error-description', () => ( {
	__esModule: true,
	default: ( { errorSet }: { errorSet: { type: string } } ) => <p>description:{ errorSet.type }</p>,
} ) );
/* The collapse reports at once, so dismissing is synchronous here. */
jest.mock( '$features/ui/collapse/collapse', () => ( {
	__esModule: true,
	default: ( {
		open,
		onCollapsed,
		children,
	}: {
		open: boolean;
		onCollapsed: () => void;
		children: React.ReactNode;
	} ) => {
		if ( ! open ) {
			onCollapsed();
			return null;
		}
		return <div>{ children }</div>;
	},
} ) );

const posts = {
	key: 'posts',
	label: 'Posts',
	errorType: 'HttpError',
	errors: [ { type: 'HttpError' } ],
};
const pages = {
	key: 'pages',
	label: 'Pages',
	errorType: 'LoadTimeoutError',
	errors: [ { type: 'LoadTimeoutError' } ],
};

let mockRecommendations: {
	activeRecommendations: ( typeof posts )[];
	dismissedRecommendations: ( typeof posts )[];
	dismiss: jest.Mock;
	showDismissed: jest.Mock;
};

describe( 'CriticalCssAdvancedCards', () => {
	beforeEach( () => {
		mockRecommendations = {
			activeRecommendations: [ posts ],
			dismissedRecommendations: [ pages ],
			dismiss: jest.fn(),
			showDismissed: jest.fn(),
		};
	} );

	it( 'renders an intro card and one card per recommendation', () => {
		render( <CriticalCssAdvancedCards /> );

		expect( screen.getByText( /we have identified a few more/ ) ).toBeTruthy();
		expect( screen.getAllByRole( 'heading', { level: 2 } ).map( h => h.textContent ) ).toEqual( [
			'Posts',
		] );
		expect( screen.getByText( 'description:HttpError' ) ).toBeTruthy();
	} );

	it( 'congratulates once nothing is active', () => {
		mockRecommendations.activeRecommendations = [];
		mockRecommendations.dismissedRecommendations = [];
		render( <CriticalCssAdvancedCards /> );

		expect( screen.getByText( /Congratulations/ ) ).toBeTruthy();
		expect( screen.queryByRole( 'heading', { level: 2 } ) ).toBeNull();
	} );

	it( 'dismisses a recommendation after its card collapses', () => {
		render( <CriticalCssAdvancedCards /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( mockRecommendations.dismiss ).toHaveBeenCalledWith( posts );
		expect( screen.queryByRole( 'heading', { level: 2 } ) ).toBeNull();
	} );

	it( 'reveals the dismissed recommendations after the link collapses', () => {
		render( <CriticalCssAdvancedCards /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Show 1 hidden recommendation.' } ) );

		expect( mockRecommendations.showDismissed ).toHaveBeenCalledTimes( 1 );
	} );
} );
