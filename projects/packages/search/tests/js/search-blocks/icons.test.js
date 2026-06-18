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

		for ( const [ name, icon ] of Object.entries( icons ) ) {
			if ( name === 'jetpack-search/powered-by' ) {
				continue;
			}

			expect( icon ).not.toHaveProperty( 'foreground' );
			expect( icon ).not.toHaveProperty( 'background' );
		}
	} );
} );
