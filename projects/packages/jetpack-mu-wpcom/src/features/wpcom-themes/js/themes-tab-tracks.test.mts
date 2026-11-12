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
				source: 'tab',
			} ),
			[
				'wpcom_marketplace_tab_theme_purchase_click',
				{
					theme: 'organic-stax',
					theme_tier: 'premium',
					action: 'upgrade',
					required_plan: 'value_bundle',
					context: 'card',
					source: 'tab',
				},
			]
		);
	} );

	it( 'sends an empty plan for a subscribe link in the preview of a search result', () => {
		assert.deepEqual(
			clickEvent( {
				wpcomThemesTrack: 'subscribe',
				theme: 'organic-stax',
				themeTier: 'partner',
				requiredPlan: '',
				context: 'preview',
				source: 'search',
			} ),
			[
				'wpcom_marketplace_tab_theme_purchase_click',
				{
					theme: 'organic-stax',
					theme_tier: 'partner',
					action: 'subscribe',
					required_plan: '',
					context: 'preview',
					source: 'search',
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
	it( 'records clicks and middle-clicks on a tracked link, and nothing else', () => {
		type OnClick = ( event: { type: string; button: number; target: unknown } ) => void;

		const events: unknown[] = [];
		const handlers: Record< string, OnClick > = {};
		const doc = {
			addEventListener: ( type: string, handler: OnClick, capture: boolean ) => {
				assert.equal( capture, true, `${ type } listens while capturing` );
				handlers[ type ] = handler;
			},
		} as unknown as Document;
		const onLink = { closest: () => ( { dataset: { wpcomThemesTrack: 'upgrade', theme: 'x' } } ) };

		trackThemesTab( doc, ( ...event ) => events.push( event ) );
		handlers.click( { type: 'click', button: 0, target: onLink } );
		handlers.auxclick( { type: 'auxclick', button: 1, target: onLink } );
		handlers.auxclick( { type: 'auxclick', button: 2, target: onLink } );
		handlers.click( { type: 'click', button: 0, target: { closest: () => null } } );

		assert.equal( events.length, 2 );
		assert.equal( ( events[ 1 ] as unknown[] )[ 0 ], 'wpcom_marketplace_tab_theme_purchase_click' );
	} );

	it( "records a change of the pricing filter, and not of core's own filters", () => {
		type OnChange = ( event: { target: unknown } ) => void;

		const events: unknown[] = [];
		let onChange: OnChange = () => {};
		const doc = {
			addEventListener: ( type: string, handler: OnChange ) => {
				if ( type === 'change' ) {
					onChange = handler;
				}
			},
		} as unknown as Document;

		trackThemesTab( doc, ( ...event ) => events.push( event ) );
		onChange( { target: { dataset: { wpcomThemesPricing: '' }, value: 'included' } } );
		onChange( { target: { dataset: {}, value: 'blog' } } );

		assert.deepEqual( events, [
			[ 'wpcom_marketplace_tab_theme_pricing_filter', { pricing: 'included' } ],
		] );
	} );
} );
