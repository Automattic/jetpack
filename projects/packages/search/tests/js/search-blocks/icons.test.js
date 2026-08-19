import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import BLOCK_ICONS, {
	FILTER_CHECKBOX_VARIATION_ICONS,
} from '../../../src/search-blocks/editor/icons';

describe( 'Search block editor icons', () => {
	it( 'lets the editor paint Search block icons with the default icon color', () => {
		const icons = {
			...BLOCK_ICONS,
			...Object.fromEntries(
				Object.entries( FILTER_CHECKBOX_VARIATION_ICONS ).map( ( [ name, icon ] ) => [
					`jetpack-search/filter-checkbox:${ name }`,
					icon,
				] )
			),
		};

		for ( const icon of Object.values( icons ) ) {
			expect( icon ).not.toHaveProperty( 'foreground' );
			expect( icon ).not.toHaveProperty( 'background' );
		}
	} );

	it( 'keeps the Powered by Jetpack logo shape while using the current icon color', () => {
		const icon = BLOCK_ICONS[ 'jetpack-search/powered-by' ];

		expect( icon.type ).toBe( JetpackLogo );
		expect( icon ).toHaveProperty( 'props.logoColor', 'currentColor' );
		expect( icon ).toHaveProperty( 'props.showText', false );
	} );
} );
