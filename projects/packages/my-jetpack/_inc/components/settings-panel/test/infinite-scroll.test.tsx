import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { InfiniteScrollSettings } from '../infinite-scroll';
import type { MyJetpackModule } from '../../../types';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		fetchModules: jest.fn(),
		createErrorNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
	} ),
} ) );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );
jest.mock( '../../module-toggle', () => ( {
	ModuleToggle: ( { labelledby, disabled }: { labelledby?: string; disabled?: boolean } ) => (
		<input type="checkbox" aria-labelledby={ labelledby } disabled={ disabled } />
	),
} ) );

const build = ( overrides: Partial< MyJetpackModule > = {} ) =>
	( {
		module: 'infinite-scroll',
		name: 'Infinite Scroll',
		activated: true,
		override: false,
		options: { infinite_scroll: { current_value: false } },
		...overrides,
	} ) as unknown as MyJetpackModule;

const setThemeSupport = ( infiniteScroll: boolean ) => {
	window.JetpackScriptData = {
		jetpack: { themeSupports: { infiniteScroll } },
	} as unknown as typeof window.JetpackScriptData;
};

beforeEach( () => {
	jest.clearAllMocks();
	( apiFetch as unknown as jest.Mock ).mockResolvedValue( {} );
	setThemeSupport( true );
} );

afterEach( () => {
	delete window.JetpackScriptData;
} );

describe( 'InfiniteScrollSettings', () => {
	it.each( [
		[ 'the stored mode', { current_value: false }, /with a button/ ],
		[ 'scroll when nothing is stored', undefined, /as the reader scrolls/ ],
	] )( 'selects %s', ( _name, option, checked ) => {
		render(
			<InfiniteScrollSettings
				module={ build( { options: option ? { infinite_scroll: option } : [] } ) }
				disabled={ false }
			/>
		);

		expect( screen.getByRole( 'radio', { name: checked } ) ).toBeChecked();
	} );

	it( 'saves the scroll mode as the infinite_scroll option', async () => {
		render( <InfiniteScrollSettings module={ build() } disabled={ false } /> );
		await userEvent.click( screen.getByRole( 'radio', { name: /as the reader scrolls/ } ) );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/settings',
			method: 'POST',
			data: { infinite_scroll: true },
		} );
	} );

	it.each( [
		[ 'the module is off', { activated: false }, false ],
		[ 'the site cannot use it', {}, true ],
	] )( 'locks the mode when %s', ( _name, overrides, disabled ) => {
		render( <InfiniteScrollSettings module={ build( overrides ) } disabled={ disabled } /> );

		for ( const radio of screen.getAllByRole( 'radio' ) ) {
			expect( radio ).toHaveAttribute( 'aria-disabled', 'true' );
		}
	} );

	it.each( [
		[ 'locks the switch while the module is off', false, 'toBeDisabled' ],
		[ 'leaves the switch free to turn an active module off', true, 'toBeEnabled' ],
	] as const )(
		'asks for theme support when the theme lacks it, and %s',
		( _name, activated, state ) => {
			setThemeSupport( false );
			render( <InfiniteScrollSettings module={ build( { activated } ) } disabled={ false } /> );

			expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: /Learn how to add support/ } ) ).toHaveAttribute(
				'href',
				expect.stringContaining( 'anchor=theme' )
			);
			expect(
				screen.getByRole( 'checkbox', { name: 'Load more posts without leaving the page' } )
			)[ state ]();
		}
	);
} );
