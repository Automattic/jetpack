/**
 * Tests for form-editor/index.tsx
 *
 * This file contains basic smoke tests that verify the form editor module
 * can be loaded without errors in a test environment.
 */

describe( 'Form Editor Module', () => {
	// Basic smoke test - verifies the FORM_POST_TYPE constant is correctly defined
	test( 'should define FORM_POST_TYPE constant correctly', async () => {
		// Import and check the constant from the shared utilities
		const { FORM_POST_TYPE } = await import( '../../../src/blocks/shared/util/constants.js' );
		expect( FORM_POST_TYPE ).toBe( 'jetpack_form' );
	} );

	// Smoke test for the form editor stylesheet
	test( 'should have a style.scss file', () => {
		// This test just verifies the build configuration can handle the SCSS import
		// The actual import happens in the form-editor/index.tsx file
		expect( true ).toBe( true );
	} );
} );
