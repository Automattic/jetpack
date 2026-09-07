import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldShowPreLaunchModal } from './should-show-pre-launch-modal.ts';

const plan = { product_slug: 'value_bundle', product_name: 'Explorer' };

describe( 'shouldShowPreLaunchModal', () => {
	it( 'is true for a paid plan with a custom domain', () => {
		assert.equal( shouldShowPreLaunchModal( { sitePlan: plan, hasCustomDomain: true } ), true );
	} );

	it( 'is false without a custom domain', () => {
		assert.equal( shouldShowPreLaunchModal( { sitePlan: plan, hasCustomDomain: false } ), false );
	} );

	it( 'is false without a paid plan', () => {
		assert.equal( shouldShowPreLaunchModal( { sitePlan: null, hasCustomDomain: true } ), false );
	} );

	it( 'is false for a trial despite plan and custom-domain entitlements', () => {
		assert.equal(
			shouldShowPreLaunchModal( { sitePlan: plan, hasCustomDomain: true, isTrial: true } ),
			false
		);
	} );

	it( 'is false when both are missing', () => {
		assert.equal( shouldShowPreLaunchModal( {} ), false );
	} );

	it( 'returns a boolean rather than the passed-through value', () => {
		// hasCustomDomain can arrive as an undefined window-data field.
		assert.equal(
			shouldShowPreLaunchModal( { sitePlan: plan, hasCustomDomain: undefined } ),
			false
		);
	} );
} );
