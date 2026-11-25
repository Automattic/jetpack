import { jest } from '@jest/globals';

let seoToolsActive = false;
jest.unstable_mockModule( '@wordpress/route', () => ( {
	redirect: ( options: object ) => ( { redirect: options } ),
} ) );
jest.unstable_mockModule( '../../_inc/data/is-seo-tools-active', () => ( {
	default: () => seoToolsActive,
} ) );

const routes = {
	overview: ( await import( '../../routes/overview/route' ) ).route,
	content: ( await import( '../../routes/content/route' ) ).route,
	geo: ( await import( '../../routes/geo/route' ) ).route,
};

const thrownBy = ( run: () => void ): unknown => {
	try {
		run();
	} catch ( error ) {
		return error;
	}
	return undefined;
};

describe( 'tabs that need SEO tools', () => {
	it.each( Object.keys( routes ) as Array< keyof typeof routes > )(
		'send %s to Settings only while SEO tools are off',
		name => {
			seoToolsActive = true;
			expect( thrownBy( routes[ name ].beforeLoad ) ).toBeUndefined();

			seoToolsActive = false;
			expect( thrownBy( routes[ name ].beforeLoad ) ).toEqual( {
				redirect: { href: '/settings', replace: true },
			} );
		}
	);
} );
