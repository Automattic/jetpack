/**
 * External dependencies
 */
import { seen } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { withWidgetTypeAliases } from './widget-type-aliases';
import type { WidgetType } from '@wordpress/widget-primitives';

const base = {
	name: 'jpa/base',
	title: 'Base',
	help: { content: 'Base help' },
	icon: 'base-icon',
} as unknown as WidgetType;

describe( 'withWidgetTypeAliases', () => {
	it( 'appends one type per variant, overriding only what the variant sets', () => {
		const result = withWidgetTypeAliases(
			[ base ],
			[
				{
					baseType: 'jpa/base',
					variants: [
						{ name: 'jpa/base--plain', getTitle: () => 'Plain' },
						{
							name: 'jpa/base--custom',
							getTitle: () => 'Custom',
							getHelp: () => ( { content: 'Custom help' } ),
							icon: seen,
						},
					],
				},
			]
		);

		expect( result ).toEqual( [
			base,
			{ ...base, name: 'jpa/base--plain', title: 'Plain' },
			{
				...base,
				name: 'jpa/base--custom',
				title: 'Custom',
				help: { content: 'Custom help' },
				icon: seen,
			},
		] );
	} );

	it( 'returns the same array while the base type has not resolved', () => {
		const widgetTypes = [ base ];

		expect(
			withWidgetTypeAliases( widgetTypes, [
				{ baseType: 'jpa/missing', variants: [ { name: 'jpa/missing--x', getTitle: () => 'X' } ] },
			] )
		).toBe( widgetTypes );
	} );
} );
