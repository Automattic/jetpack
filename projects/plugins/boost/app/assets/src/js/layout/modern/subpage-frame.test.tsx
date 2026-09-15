/* No jest-dom in this project. */
/* eslint-disable jest-dom/prefer-to-have-text-content, testing-library/no-container, testing-library/no-node-access */
import { render, screen } from '@testing-library/react';
import SubpageFrame from './subpage-frame';

jest.mock( '$features/ui/subpage-breadcrumbs/subpage-breadcrumbs', () => ( {
	__esModule: true,
	default: ( { current }: { current: string } ) => <nav>Boost / { current }</nav>,
} ) );

describe( 'SubpageFrame', () => {
	it( 'renders the breadcrumb header above the content', () => {
		const { container } = render(
			<SubpageFrame title="Cache debug log">
				<p>content</p>
			</SubpageFrame>
		);

		const header = screen.getByRole( 'banner' );
		expect( header.textContent ).toContain( 'Boost / Cache debug log' );
		expect( header.querySelector( 'svg' ) ).not.toBeNull();
		expect( header.compareDocumentPosition( screen.getByText( 'content' ) ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect( container.querySelector( '.jb-dashboard' ) ).toBeNull();
	} );
} );
