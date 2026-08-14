import { render } from '@testing-library/react';
import { GlobalChartsProvider } from '../global-charts-provider';

// GlobalChartsProvider's own render tree has no DOM node above this div (its
// context provider renders no element), so it is always the container's
// first child.
const getWrapperElement = ( container: HTMLElement ): HTMLElement => {
	// eslint-disable-next-line testing-library/no-node-access
	const wrapper = container.firstElementChild;

	if ( ! wrapper ) {
		throw new Error( 'Expected GlobalChartsProvider to render a wrapper element.' );
	}

	return wrapper as HTMLElement;
};

const assertNoSelfReferentialCustomProperty = ( wrapper: HTMLElement ) => {
	const declarations = wrapper.style.cssText
		.split( ';' )
		.map( declaration => declaration.trim() )
		.filter( Boolean );

	for ( const declaration of declarations ) {
		const separatorIndex = declaration.indexOf( ':' );
		const name = declaration.slice( 0, separatorIndex ).trim();
		const value = declaration.slice( separatorIndex + 1 ).trim();

		if ( name.startsWith( '--a8c-charts-' ) ) {
			expect( value ).not.toContain( `var(${ name }` );
		}
	}
};

// Confirms the wrapper element never carries a self-referential custom property in
// real usage, against the real defaultTheme, both with no theme prop and with a
// partial theme. Because the real defaultTheme's mapped fields are themselves
// self-pointers, themeOverrideVars' own guard neutralises them regardless of which
// theme object the provider passes it, so this file alone cannot distinguish reading
// `theme` from reading `providerTheme` — see theme-override-vars-guard.test.tsx, which
// mocks a non-pointer default to make that distinction observable.
describe( 'GlobalChartsProvider wrapper style', () => {
	it( 'never carries a self-referential custom property with no theme prop', () => {
		const { container } = render(
			<GlobalChartsProvider>
				<div>child</div>
			</GlobalChartsProvider>
		);

		const wrapper = getWrapperElement( container );

		assertNoSelfReferentialCustomProperty( wrapper );
		expect( wrapper.style.cssText.replace( /\s/g, '' ) ).toBe( 'display:contents;' );
	} );

	it( 'never carries a self-referential custom property with a partial theme that leaves the merged default pointer in place', () => {
		const { container } = render(
			<GlobalChartsProvider theme={ { tickLength: 8 } }>
				<div>child</div>
			</GlobalChartsProvider>
		);

		const wrapper = getWrapperElement( container );

		assertNoSelfReferentialCustomProperty( wrapper );
		expect( wrapper.style.getPropertyValue( '--a8c-charts-color-grid' ) ).toBe( '' );
	} );
} );
