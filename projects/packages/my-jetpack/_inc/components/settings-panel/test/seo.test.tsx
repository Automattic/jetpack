import { moduleSettings } from '../registry';
import { SeoSettings } from '../seo';

describe( 'SeoSettings', () => {
	it.each( [ 'seo-tools', 'verification-tools' ] )( 'is the panel of %s', slug => {
		expect( moduleSettings[ slug ] ).toBe( SeoSettings );
	} );
} );
