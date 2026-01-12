/**
 * Tests for synced-form-helpers
 *
 * These tests verify the utility functions used for synced form operations.
 */

import {
	filterSyncedAttributes,
	isSyncedFormContext,
} from '../../../src/blocks/contact-form/utils/synced-form-helpers';
import { FORM_POST_TYPE } from '../../../src/blocks/shared/util/constants';

describe( 'filterSyncedAttributes', () => {
	test( 'removes layout attributes and ref', () => {
		const attributes = {
			className: 'my-class',
			align: 'wide',
			style: { color: 'red' },
			ref: 123,
			lock: { move: true, remove: false },
			to: 'test@example.com',
			subject: 'Test Subject',
		};

		const result = filterSyncedAttributes( attributes );

		expect( result.className ).toBeUndefined();
		expect( result.align ).toBeUndefined();
		expect( result.style ).toBeUndefined();
		expect( result.ref ).toBeUndefined();
		expect( result.lock ).toBeUndefined();
		expect( result.to ).toBe( 'test@example.com' );
		expect( result.subject ).toBe( 'Test Subject' );
	} );

	test( 'preserves form-specific attributes', () => {
		const attributes = {
			to: 'test@example.com',
			subject: 'Test Subject',
			customThankyouMessage: 'Thanks!',
			emailNotifications: true,
		};

		const result = filterSyncedAttributes( attributes );

		expect( result.to ).toBe( 'test@example.com' );
		expect( result.subject ).toBe( 'Test Subject' );
		expect( result.customThankyouMessage ).toBe( 'Thanks!' );
		expect( result.emailNotifications ).toBe( true );
	} );

	test( 'does not mutate original attributes object', () => {
		const attributes = {
			ref: 123,
			to: 'test@example.com',
		};

		const result = filterSyncedAttributes( attributes );

		expect( attributes.ref ).toBe( 123 );
		expect( result.ref ).toBeUndefined();
	} );
} );

describe( 'isSyncedFormContext', () => {
	test( 'returns true when ref exists and postType is not jetpack_form', () => {
		expect( isSyncedFormContext( 123, 'post' ) ).toBe( true );
		expect( isSyncedFormContext( 456, 'page' ) ).toBe( true );
	} );

	test( 'returns false when ref exists but postType is jetpack_form', () => {
		expect( isSyncedFormContext( 123, FORM_POST_TYPE ) ).toBe( false );
	} );

	test( 'returns false when ref is undefined or falsy', () => {
		expect( isSyncedFormContext( undefined, 'post' ) ).toBe( false );
		expect( isSyncedFormContext( null, 'post' ) ).toBe( false );
		expect( isSyncedFormContext( 0, 'post' ) ).toBe( false );
	} );

	test( 'differentiates between editing form source vs using synced form', () => {
		const formId = 123;

		// Editing the jetpack_form post itself (not synced context)
		expect( isSyncedFormContext( formId, FORM_POST_TYPE ) ).toBe( false );

		// Using the form in a regular post (synced context)
		expect( isSyncedFormContext( formId, 'post' ) ).toBe( true );
	} );
} );
