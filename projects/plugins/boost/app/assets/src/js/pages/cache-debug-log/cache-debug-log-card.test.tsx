/* No jest-dom in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content, testing-library/no-container, testing-library/no-node-access */
import { render, screen } from '@testing-library/react';
import CacheDebugLogCard from './cache-debug-log-card';

jest.mock( '$features/page-cache/lib/stores', () => ( {
	useDebugLog: () => [ { data: mockLog } ],
} ) );
jest.mock( '$features/page-cache/copy-log-button/copy-log-button', () => ( {
	__esModule: true,
	default: ( { text }: { text: string } ) => <button>copy:{ text }</button>,
} ) );

let mockLog: string | undefined;

describe( 'CacheDebugLogCard', () => {
	it( 'shows the log with a copy button in the card header', () => {
		mockLog = 'line 1\nline 2';
		const { container } = render( <CacheDebugLogCard /> );

		expect( screen.getByRole( 'heading', { level: 2 } ).textContent ).toBe( 'Cache log' );
		expect( container.querySelector( 'pre' )?.textContent ).toBe( 'line 1\nline 2' );
		expect( screen.getByRole( 'button' ).textContent ).toBe( 'copy:line 1\nline 2' );
	} );

	it( 'shows an empty state instead of an empty log', () => {
		mockLog = '';
		const { container } = render( <CacheDebugLogCard /> );

		expect( container.querySelector( 'pre' ) ).toBeNull();
		expect( screen.getByText( 'Nothing has been logged yet.' ) ).toBeTruthy();
		expect( screen.getByRole( 'button' ).textContent ).toBe( 'copy:' );
	} );
} );
