import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { noticeActions } from './editor-notice-content.ts';

const primary = {
	label: 'Renew now',
	url: 'https://wordpress.com/checkout/business-bundle/example.com',
};
const secondary = { label: 'View other plans', url: 'https://wordpress.com/plans/example.com' };
const click = {} as Parameters< ReturnType< typeof noticeActions >[ 0 ][ 'onClick' ] >[ 0 ];

describe( 'noticeActions', () => {
	it( 'offers only the primary CTA outside the grace period', () => {
		const actions = noticeActions( { primary, secondary: null }, () => {} );
		assert.deepEqual(
			actions.map( ( { label, url, variant } ) => ( { label, url, variant } ) ),
			[ { label: 'Renew now', url: primary.url, variant: 'primary' } ]
		);
	} );

	it( 'adds the other-plans link in the grace period', () => {
		const actions = noticeActions( { primary, secondary }, () => {} );
		assert.deepEqual(
			actions.map( ( { label, url } ) => ( { label, url } ) ),
			[
				{ label: 'Renew now', url: primary.url },
				{ label: 'View other plans', url: secondary.url },
			]
		);
	} );

	it( 'routes each click to its CTA', () => {
		const clicks: Array< [ string, { label: string } ] > = [];
		const actions = noticeActions( { primary, secondary }, ( cta, target ) =>
			clicks.push( [ cta, target ] )
		);
		actions[ 1 ].onClick( click );
		actions[ 0 ].onClick( click );
		assert.deepEqual( clicks, [
			[ 'secondary', secondary ],
			[ 'primary', primary ],
		] );
	} );
} );
