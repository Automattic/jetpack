/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import 'jetpack-js-tools/jest/setup-jest-dom';
import { render, screen } from '@testing-library/react';
import SubpageFrame from './subpage-frame';
import BoostPage from '../../../../../../_inc/components/boost-page';
import type { ReactNode } from 'react';

const mockBackToSettings = jest.fn();
jest.mock( '$lib/navigation/use-back-to-settings', () => ( {
	useBackToSettings: () => ( {
		href: '?page=jetpack-boost&p=%2F%3Ftab%3Dsettings',
		onClick: mockBackToSettings,
	} ),
} ) );

jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { breadcrumbs, children }: { breadcrumbs: ReactNode; children: ReactNode } ) => (
		<main>
			{ breadcrumbs }
			{ children }
		</main>
	),
} ) );

describe( 'SubpageFrame', () => {
	it( 'renders the breadcrumb header above the content', () => {
		const { container } = render(
			<SubpageFrame title="Cache debug log">
				<p>content</p>
			</SubpageFrame>
		);

		const header = screen.getByRole( 'banner' );
		expect( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) ).toBeInTheDocument();
		expect( header.querySelector( 'svg' ) ).toBeInTheDocument();
		expect( header.nextElementSibling ).toHaveTextContent( 'content' );
		expect( container.querySelector( '.jb-dashboard' ) ).not.toBeInTheDocument();
	} );

	it.each( [ 'Cache debug log', 'Critical CSS recommendations' ] )(
		'renders one Jetpack-rooted trail and heading for %s',
		title => {
			Object.assign( window, { wpApiSettings: { root: '/wp-json/', nonce: 'test' } } );
			render(
				<BoostPage isSubpage subpage={ <SubpageFrame title={ title }>content</SubpageFrame> }>
					dashboard
				</BoostPage>
			);
			expect( screen.getAllByRole( 'navigation', { name: 'Breadcrumbs' } ) ).toHaveLength( 1 );
			expect( screen.getAllByRole( 'heading', { level: 1, hidden: true } ) ).toHaveLength( 1 );
			expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( title );
			expect( screen.getByRole( 'link', { name: 'Jetpack' } ) ).toHaveAttribute(
				'href',
				'admin.php?page=my-jetpack'
			);
			expect( screen.getByRole( 'link', { name: 'Boost' } ) ).toHaveAttribute(
				'href',
				'?page=jetpack-boost&p=%2F%3Ftab%3Dsettings'
			);
			expect(
				screen.getByText( title, { selector: '[aria-current="page"]' } )
			).toBeInTheDocument();
		}
	);
} );
