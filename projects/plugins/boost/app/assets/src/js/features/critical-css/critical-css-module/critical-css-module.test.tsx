/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- The main Boost Jest project does not load jest-dom. */
import { fireEvent, render, screen } from '@testing-library/react';
import { MODERN_ROOT_ID } from '$lib/modern/mode';
import { recordBoostEvent } from '$lib/utils/analytics';
import CriticalCssModule from './critical-css-module';
import type { ReactNode } from 'react';

const mockRegenerate = jest.fn();

jest.mock( '@wordpress/api-fetch', () => jest.fn( () => new Promise( () => {} ) ) );
jest.mock( '$features/module/module', () => ( {
	__esModule: true,
	default: ( {
		description,
		children,
		onEnable,
	}: {
		description: ReactNode;
		children: ReactNode;
		onEnable?: () => void;
	} ) => (
		<section data-testid="module-card">
			<button onClick={ onEnable }>Enable</button>
			{ description }
			{ children }
		</section>
	),
} ) );
jest.mock( '$features/critical-css/critical-css-meta/critical-css-meta', () => () => null );
jest.mock( '$features/critical-css/lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( { mutate: mockRegenerate } ),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
jest.mock( '$lib/stores/premium-features', () => ( { usePremiumFeatures: () => [] } ) );
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );

test( 'routes the Critical CSS notice to the upgrade page without inline license redemption', () => {
	Object.assign( globalThis, {
		Jetpack_Boost: { site: { online: true, myJetpack: true, host: 'other' } },
	} );
	render( <div id={ MODERN_ROOT_ID } data-testid="dashboard-root" /> );
	render( <CriticalCssModule />, { container: screen.getByTestId( 'dashboard-root' ) } );
	expect( screen.getByRole( 'link', { name: 'Upgrade now' } ).getAttribute( 'href' ) ).toBe(
		'admin.php?page=my-jetpack#/add-boost'
	);
	expect( screen.queryByRole( 'link', { name: 'Use license key' } ) ).toBeNull();
	expect( screen.queryByRole( 'dialog' ) ).toBeNull();
} );

test( 'records the Critical CSS documentation link click', () => {
	Object.assign( globalThis, {
		Jetpack_Boost: { site: { online: true, myJetpack: true, host: 'unknown' } },
		myJetpackInitialState: { products: { items: { boost: { slug: 'boost', title: 'Boost' } } } },
		JP_CONNECTION_INITIAL_STATE: {},
	} );
	render( <CriticalCssModule /> );
	// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
	fireEvent.click( screen.getByRole( 'link', { name: /Critical CSS/ } ) );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'critical_css_link_clicked', {} );
} );

test( 'enabling manual CSS waits for Generate instead of regenerating', () => {
	Object.assign( globalThis, {
		Jetpack_Boost: { site: { online: true, myJetpack: true, host: 'unknown' } },
		myJetpackInitialState: { products: { items: { boost: { slug: 'boost', title: 'Boost' } } } },
		JP_CONNECTION_INITIAL_STATE: {},
	} );
	render( <CriticalCssModule /> );
	// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
	fireEvent.click( screen.getByRole( 'button', { name: 'Enable' } ) );
	expect( mockRegenerate ).not.toHaveBeenCalled();
} );
