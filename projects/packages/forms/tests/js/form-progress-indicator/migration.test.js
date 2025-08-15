import { createElement } from '@wordpress/element';
import { settings } from '../../../src/blocks/form-progress-indicator/index.js';

describe( 'Form Progress Indicator Block Migration', () => {
	test( 'successfully migrates old block structure', () => {
		expect( settings.deprecated ).toHaveLength( 1 );
		const deprecatedBlock = settings.deprecated[ 0 ];
		expect( deprecatedBlock.apiVersion ).toBe( 2 );

		const oldStructure = deprecatedBlock.save();

		const expectedNewStructure = createElement(
			'div',
			{ className: 'jetpack-form-progress-indicator--wrapper' },
			createElement(
				'div',
				{ className: 'wp-block-jetpack-form-progress-indicator' },
				createElement(
					'div',
					{ className: 'jetpack-form-progress-indicator-steps' },
					createElement( 'div', { className: 'jetpack-form-progress-indicator-progress' } )
				)
			)
		);

		// Verify deprecated version generates old structure
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

		// Verify structures are different
		expect( oldStructure ).not.toEqual( expectedNewStructure );

		// Verify class name migration: bar → steps
		const oldClassName = oldStructure.props.children.props.children.props.className;
		const newClassName = expectedNewStructure.props.children.props.children.props.className;
		expect( oldClassName ).toBe( 'jetpack-form-progress-indicator-bar' );
		expect( newClassName ).toBe( 'jetpack-form-progress-indicator-steps' );

		// Verify migration adds default variant
		const testAttributes = { className: 'custom-class' };
		const migratedAttributes = deprecatedBlock.migrate( testAttributes );
		expect( migratedAttributes ).toEqual( {
			...testAttributes,
			variant: 'line',
		} );
	} );
} );
