import { getCategoryIcon } from '../category-icons';

// The catalog's categories, plus one it doesn't have yet.
const SLUGS = [
	'accessibility',
	'general',
	'marketing',
	'performance',
	'seo',
	'setup-launch',
	'site-health',
	'writing',
	'not-a-category',
];

describe( 'getCategoryIcon', () => {
	test( 'gives every category, and the fallback, an icon of its own', () => {
		const icons = SLUGS.map( getCategoryIcon );

		expect( icons.every( Boolean ) ).toBe( true );
		expect( new Set( icons ).size ).toBe( SLUGS.length );
	} );
} );
