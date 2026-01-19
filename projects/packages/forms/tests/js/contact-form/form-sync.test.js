/**
 * Tests for synced-form-helpers
 *
 * These tests verify the utility functions used for synced form operations.
 */

import { filterSyncedAttributes } from '../../../src/blocks/contact-form/util/form-sync';

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
