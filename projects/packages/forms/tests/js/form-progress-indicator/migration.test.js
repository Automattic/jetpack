import { describe, expect, jest, test } from '@jest/globals';
import { createElement } from '@wordpress/element';

// Mock WordPress dependencies that use JSX
await jest.unstable_mockModule( '@wordpress/primitives', () => ( {
	Circle: 'circle-mock',
	Rect: 'rect-mock',
	SVG: 'svg-mock',
	Path: 'path-mock',
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: jest.fn( text => text ),
} ) );

await jest.unstable_mockModule( '../../../src/blocks/form-progress-indicator/edit.js', () => ( {
	default: jest.fn( () => null ),
} ) );

// Dynamically import settings after mocks are set up
const settingsModule = await import( '../../../src/blocks/form-progress-indicator/index.js' );
const { settings } = settingsModule;

describe( 'Form Progress Indicator Block Migration', () => {
	test( 'successfully migrates old block structure', () => {
		expect( settings.deprecated ).toHaveLength( 1 );
		const deprecatedBlock = settings.deprecated[ 0 ];
		expect( deprecatedBlock.apiVersion ).toBe( 2 );

		// Verify deprecated version generates old structure
		const oldStructure = deprecatedBlock.save();
		expect( oldStructure ).toEqual(
			createElement(
				'div',
				{ className: 'jetpack-form-progress-indicator--wrapper' },
				createElement(
					'div',
					{ className: 'wp-block-jetpack-form-progress-indicator' },
					createElement( 'div', { className: 'jetpack-form-progress-indicator-bar' } )
				)
			)
		);

		// Test migration with typical old block attributes
		const oldAttributes = {
			progressColor: '#ff0000',
			progressBackgroundColor: '#cccccc',
		};
		const migratedAttributes = deprecatedBlock.migrate( oldAttributes );
		expect( migratedAttributes ).toEqual( {
			...oldAttributes,
			variant: 'line',
		} );

		// Test migration when variant already exists (should not override)
		const attributesWithVariant = {
			progressColor: '#0000ff',
			variant: 'dots',
		};
		const migratedAttributesWithVariant = deprecatedBlock.migrate( attributesWithVariant );
		expect( migratedAttributesWithVariant ).toEqual( attributesWithVariant );
	} );
} );
