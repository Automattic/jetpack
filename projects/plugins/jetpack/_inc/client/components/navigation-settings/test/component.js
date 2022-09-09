import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen } from 'test/test-utils';
import { NavigationSettings } from '../index';

// Mock components that do fetches in the background. We supply needed state directly.
jest.mock( 'components/data/query-site-plugins', () => ( {
	__esModule: true,
	default: () => 'query-site-plugins',
} ) );

describe( 'NavigationSettings', () => {
	const testProps = {
		hasAnyOfTheseModules: () => true,
		hasAnyPerformanceFeature: true,
		hasAnySecurityFeature: true,
		userCanManageModules: false,
		isSubscriber: true,
		location: {
			pathname: '/settings',
		},
		routeName: 'General',
		history: {
			listen: () => {},
		},
		isModuleActivated: () => true,
		isSiteConnected: true,
		siteRawUrl: 'example.org',
		siteAdminUrl: 'https://example.org/wp-admin/',
		searchForTerm: () => {},
		isLinked: true,
		moduleList: {
			sitemaps: true,
			carousel: true,
			'custom-content-types': true,
			'verification-tools': true,
			markdown: true,
			'infinite-scroll': true,
			'gravatar-hovercards': true,
			sharedaddy: true,
			sso: true,
			'related-posts': true,
			monitor: true,
			vaultpress: true,
			stats: true,
			masterbar: true,
			'google-analytics': true,
			'seo-tools': true,
			wordads: true,
			videopress: true,
			subscriptions: true,
			comments: true,
			'post-by-email': true,
			photon: true,
			publicize: true,
			likes: true,
		},
		isPluginActive: () => true,
	};

	beforeAll( () => {
		window.location.hash = '#settings';
	} );

	describe( 'initially', () => {
		it( 'renders a div with a className of "dops-navigation"', () => {
			const { container } = render( <NavigationSettings { ...testProps } /> );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			expect( container.querySelector( '.dops-navigation' ) ).toBeInTheDocument();
		} );

		it( 'renders SectionNav', () => {
			const { container } = render( <NavigationSettings { ...testProps } /> );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			expect( container.querySelector( '.dops-section-nav' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'for a Subscriber user', () => {
		it( 'does not render Settings tabs', () => {
			render( <NavigationSettings { ...testProps } /> );
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );

		it( 'does not display Search', () => {
			render( <NavigationSettings { ...testProps } /> );
			expect( screen.queryByRole( 'search' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'for Editor, Author and Contributor users', () => {
		const currentTestProps = {
			...testProps,
			userCanManageModules: false,
			isSubscriber: false,
			userCanPublish: true,
		};

		it( 'renders tabs with Writing and Sharing', () => {
			render( <NavigationSettings { ...currentTestProps } /> );
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 2 );
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
			expect( screen.getByRole( 'menuitem', { name: 'Writing' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Writing' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'Sharing' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Sharing' } ) ).toBeInTheDocument();
		} );

		it( 'show only Writing if Publicize is disabled', () => {
			render(
				// eslint-disable-next-line react/jsx-no-bind
				<NavigationSettings { ...currentTestProps } isModuleActivated={ m => 'publicize' !== m } />
			);
			// eslint-disable-next-line jest-dom/prefer-in-document -- No, we really want to assert there's exactly 1.
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 1 );
			// eslint-disable-next-line jest-dom/prefer-in-document -- No, we really want to assert there's exactly 1.
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 1 );
			expect( screen.getByRole( 'menuitem', { name: 'Writing' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Writing' } ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'menuitem', { name: 'Sharing' } ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'option', { name: 'Sharing' } ) ).not.toBeInTheDocument();
		} );

		it( 'show only Sharing if Post By Email is disabled', () => {
			render(
				<NavigationSettings
					{ ...currentTestProps }
					// eslint-disable-next-line react/jsx-no-bind
					isModuleActivated={ m => 'post-by-email' !== m }
				/>
			);
			// eslint-disable-next-line jest-dom/prefer-in-document -- No, we really want to assert there's exactly 1.
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 1 );
			// eslint-disable-next-line jest-dom/prefer-in-document -- No, we really want to assert there's exactly 1.
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 1 );
			expect( screen.queryByRole( 'menuitem', { name: 'Writing' } ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'option', { name: 'Writing' } ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'Sharing' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Sharing' } ) ).toBeInTheDocument();
		} );

		it( 'has /sharing as selected navigation item, accessing through /settings, even when both PBE and Publicize are active', () => {
			render( <NavigationSettings { ...currentTestProps } /> );
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
			const option = screen.getByRole( 'option', { name: 'Sharing' } );
			expect( option ).toHaveAttribute( 'aria-selected', 'true' );
			expect( option ).toHaveAttribute( 'href', '#sharing' );
		} );

		it( 'does not display Search', () => {
			render( <NavigationSettings { ...currentTestProps } /> );
			expect( screen.queryByRole( 'search' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'for an Admin user', () => {
		const currentTestProps = {
			...testProps,
			userCanManageModules: true,
			isSubscriber: false,
		};

		it( 'renders tabs with Discussion, Security, Performance, Traffic, Writing, Sharing', () => {
			render( <NavigationSettings { ...currentTestProps } /> );
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 6 );
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 6 );
			expect( screen.getByRole( 'menuitem', { name: 'Discussion' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Discussion' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'Security' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Security' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'Performance' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Performance' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'Traffic' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Traffic' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'Writing' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Writing' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'Sharing' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Sharing' } ) ).toBeInTheDocument();
		} );

		it( 'displays Search', () => {
			render( <NavigationSettings { ...currentTestProps } /> );
			expect( screen.getByRole( 'search' ) ).toBeInTheDocument();
		} );

		describe( 'when Search is opened', () => {
			beforeAll( () => {
				jest.useFakeTimers();
			} );
			afterAll( () => {
				jest.useRealTimers();
			} );

			it( 'does not change hash to #search', async () => {
				const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
				render( <NavigationSettings { ...currentTestProps } /> );
				await user.click( screen.getByRole( 'button', { name: 'Open Search' } ) );
				expect( window.location.hash ).toBe( '#settings' );
			} );

			describe( 'and a search term is opened', () => {
				it( 'adds a search term in a query string', async () => {
					const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
					render( <NavigationSettings { ...currentTestProps } /> );
					await user.click( screen.getByRole( 'button', { name: 'Open Search' } ) );
					await user.type( screen.getByRole( 'searchbox' ), 'search-term' );
					jest.advanceTimersByTime( 510 ); // The <Search> has delayTimeout=500
					expect( window.location.hash ).toBe( '#settings?term=search-term' );
				} );

				describe( 'and a search term is deleted', () => {
					it( 'changes hash back to #settings', async () => {
						const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
						render( <NavigationSettings { ...currentTestProps } /> );
						await user.click( screen.getByRole( 'button', { name: 'Open Search' } ) );
						await user.type( screen.getByRole( 'searchbox' ), 'search-term' );
						jest.advanceTimersByTime( 510 ); // The <Search> has delayTimeout=500
						expect( window.location.hash ).toBe( '#settings?term=search-term' );
						await user.clear( screen.getByRole( 'searchbox' ) );
						jest.advanceTimersByTime( 510 ); // The <Search> has delayTimeout=500
						expect( window.location.hash ).toBe( '#settings' );
					} );
				} );
			} );
		} );

		// @todo Formerly this test was titled "when clicked", even though it tested setting the location routeName props as shown here.
		// When I tried using userEvent to actually do a click, it didn't work. The link click changes the hash (after a delay), but
		// I think the "history" prop isn't noticing.
		it( 'switches to Traffic tab when location is set accordingly', () => {
			const currentTestProps2 = {
				...currentTestProps,
				location: {
					pathname: '/traffic',
				},
				routeName: 'Traffic',
			};
			render( <NavigationSettings { ...currentTestProps2 } /> );
			const option = screen.getByRole( 'option', { name: 'Traffic' } );
			expect( option ).toHaveAttribute( 'aria-selected', 'true' );
		} );
	} );
} );
