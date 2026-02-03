import {
	shouldWrapFieldInForm,
	shouldCreateSyncedForm,
} from '../../../../../src/blocks/shared/hooks/use-form-wrapper.js';
import { FORM_POST_TYPE } from '../../../../../src/blocks/shared/util/constants.js';

describe( 'use-form-wrapper helpers', () => {
	describe( 'shouldWrapFieldInForm', () => {
		it( 'should return false when editing a jetpack_form post type', () => {
			expect( shouldWrapFieldInForm( FORM_POST_TYPE, [] ) ).toBe( false );
		} );

		it( 'should return false when field has parent forms', () => {
			expect( shouldWrapFieldInForm( 'post', [ 'parent-form-id' ] ) ).toBe( false );
		} );

		it( 'should return true when editing a regular post with no parent form', () => {
			expect( shouldWrapFieldInForm( 'post', [] ) ).toBe( true );
		} );

		it( 'should return true when editing a page with no parent form', () => {
			expect( shouldWrapFieldInForm( 'page', [] ) ).toBe( true );
		} );

		it( 'should handle undefined parentForms', () => {
			expect( shouldWrapFieldInForm( 'post', undefined ) ).toBe( true );
		} );

		it( 'should handle null parentForms', () => {
			expect( shouldWrapFieldInForm( 'post', null ) ).toBe( true );
		} );
	} );

	describe( 'shouldCreateSyncedForm', () => {
		it( 'should return true when feature flag is enabled and block was just inserted', () => {
			expect( shouldCreateSyncedForm( true, true ) ).toBe( true );
		} );

		it( 'should return false when feature flag is disabled', () => {
			expect( shouldCreateSyncedForm( false, true ) ).toBe( false );
		} );

		it( 'should return false when block was not just inserted (e.g., preview)', () => {
			expect( shouldCreateSyncedForm( true, false ) ).toBe( false );
		} );

		it( 'should return false when both conditions are false', () => {
			expect( shouldCreateSyncedForm( false, false ) ).toBe( false );
		} );
	} );
} );
