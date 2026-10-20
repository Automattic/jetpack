import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clickEvent, trackThemesTab } from './themes-tab-tracks.ts';

describe( 'clickEvent', () => {
	it( 'sends the theme, its tier and the plan an upgrade card link sells', () => {
		assert.deepEqual(
			clickEvent( {
				wpcomThemesTrack: 'upgrade',
				theme: 'organic-stax',
				themeTier: 'premium',
				requiredPlan: 'value_bundle',
				context: 'card',
			} ),
			[
				'wpcom_marketplace_tab_theme_purchase_click',
				{
					theme: 'organic-stax',
					theme_tier: 'premium',
					action: 'upgrade',
					required_plan: 'value_bundle',
					context: 'card',
				},
			]
		);
	} );

	it( 'sends an empty plan for a subscribe link in the preview', () => {
		assert.deepEqual(
			clickEvent( {
				wpcomThemesTrack: 'subscribe',
				theme: 'organic-stax',
				themeTier: 'partner',
				requiredPlan: '',
				context: 'preview',
			} ),
			[
				'wpcom_marketplace_tab_theme_purchase_click',
				{
					theme: 'organic-stax',
					theme_tier: 'partner',
					action: 'subscribe',
					required_plan: '',
					context: 'preview',
				},
			]
		);
	} );

	it( 'ignores a link it does not know, or one with no theme', () => {
		assert.equal( clickEvent( { wpcomThemesTrack: 'toString', theme: 'organic-stax' } ), null );
		assert.equal( clickEvent( { theme: 'organic-stax' } ), null );
		assert.equal( clickEvent( { wpcomThemesTrack: 'upgrade' } ), null );
	} );
} );

describe( 'trackThemesTab', () => {
	it( 'records a click inside a tracked link, and nothing for anywhere else', () => {
		type OnClick = ( event: { target: unknown } ) => void;

		const events: unknown[] = [];
		let onClick: OnClick | undefined;
		const doc = {
			addEventListener: ( _type: string, handler: OnClick ) => ( onClick = handler ),
		} as unknown as Document;
		const link = {
			dataset: { wpcomThemesTrack: 'upgrade', theme: 'organic-stax', context: 'card' },
		};

		trackThemesTab( doc, ( ...event ) => events.push( event ) );
		onClick?.( { target: { closest: () => link } } );
		onClick?.( { target: { closest: () => null } } );

		assert.equal( events.length, 1 );
		assert.equal( ( events[ 0 ] as unknown[] )[ 0 ], 'wpcom_marketplace_tab_theme_purchase_click' );
	} );
} );
