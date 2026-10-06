import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	canProceed,
	EligibilityErrors,
	findFirstBlockingError,
	findHoldingErrors,
	hasAnyBlockingError,
	isAtomicSiteWithoutBusinessPlan,
	needsConfirmation,
	needsPlanUpgrade,
} from './eligibility.ts';
import type { TransferError } from './types.ts';

/**
 * Build the error shape PHP localizes onto the page.
 *
 * @param code    - The eligibility error code.
 * @param message - The API's own message, if it sent one.
 * @return The error.
 */
function error( code: string, message = '' ): TransferError {
	return { code, message };
}

describe( 'blocking errors', () => {
	it( 'matches a code it has copy for, ignoring the API message', () => {
		const blocking = findFirstBlockingError( [
			error( EligibilityErrors.SITE_GRAYLISTED, 'This site is not in good standing.' ),
		] );

		assert.equal( blocking?.code, EligibilityErrors.SITE_GRAYLISTED );
		assert.match( blocking?.message ?? '', /ongoing site dispute/ );
		assert.equal( blocking?.supportUrl, 'https://wordpress.com/support/suspended-blogs/' );
	} );

	it( 'carries the intent, so an in-progress setup is not styled as a failure', () => {
		assert.equal(
			findFirstBlockingError( [ error( EligibilityErrors.TRANSFER_ALREADY_EXISTS ) ] )?.intent,
			'info'
		);
		assert.equal(
			findFirstBlockingError( [ error( EligibilityErrors.NO_VIP_SITES ) ] )?.intent,
			'error'
		);
	} );

	it( 'reports nothing to block on for a clean site', () => {
		assert.equal( findFirstBlockingError( [] ), null );
		assert.equal( hasAnyBlockingError( [] ), false );
	} );

	it( 'leaves holds to the steps list rather than blocking on them', () => {
		assert.equal( findFirstBlockingError( [ error( EligibilityErrors.NO_BUSINESS_PLAN ) ] ), null );
		assert.equal( findFirstBlockingError( [ error( EligibilityErrors.EMAIL_UNVERIFIED ) ] ), null );
	} );

	// The case the modal used to render as an empty body with a disabled button.
	it( 'falls back to the API message for a code it has no copy for', () => {
		const blocking = findFirstBlockingError( [
			error( 'site_private', 'Private sites cannot be transferred.' ),
		] );

		assert.equal( blocking?.code, 'site_private' );
		assert.equal( blocking?.message, 'Private sites cannot be transferred.' );
		assert.equal( blocking?.intent, 'error' );
	} );

	it( 'falls back to generic copy when the API sent no message either', () => {
		const blocking = findFirstBlockingError( [ error( 'something_new_entirely' ) ] );

		assert.match( blocking?.message ?? '', /not currently eligible/ );
	} );

	it( 'always has something to say when the API reports an error', () => {
		for ( const code of [ 'site_private', 'is_staging_blog', 'unheard_of' ] ) {
			const errors = [ error( code ) ];

			assert.ok(
				findFirstBlockingError( errors ) !== null || findHoldingErrors( errors ).length > 0,
				code
			);
		}
	} );

	it( 'does not treat an inherited Object key as a known code', () => {
		const blocking = findFirstBlockingError( [ error( 'toString', 'Nope.' ) ] );

		assert.equal( blocking?.message, 'Nope.' );
	} );
} );

describe( 'holding errors', () => {
	it( 'keeps the order the API returned them in', () => {
		const holds = findHoldingErrors( [
			error( EligibilityErrors.EMAIL_UNVERIFIED ),
			error( EligibilityErrors.NO_BUSINESS_PLAN ),
		] );

		assert.deepEqual(
			holds.map( hold => hold.code ),
			[ EligibilityErrors.EMAIL_UNVERIFIED, EligibilityErrors.NO_BUSINESS_PLAN ]
		);
	} );

	it( 'skips codes that are not holds', () => {
		const holds = findHoldingErrors( [
			error( EligibilityErrors.SITE_GRAYLISTED ),
			error( 'site_private' ),
			error( EligibilityErrors.NON_ADMIN_USER ),
		] );

		assert.deepEqual(
			holds.map( hold => hold.code ),
			[ EligibilityErrors.NON_ADMIN_USER ]
		);
	} );

	it( 'does not pick up an inherited Object key', () => {
		assert.deepEqual( findHoldingErrors( [ error( 'constructor' ) ] ), [] );
	} );

	// wpcom sends `is_staging_blog`; keying this on `is_staging_site` silently loses the copy.
	it( 'matches the staging code wpcom really sends', () => {
		const [ hold ] = findHoldingErrors( [ error( 'is_staging_blog' ) ] );

		assert.equal( EligibilityErrors.IS_STAGING_SITE, 'is_staging_blog' );
		assert.match( hold.title, /staging site/ );
	} );

	it( 'names the plan in the upgrade hold', () => {
		const [ hold ] = findHoldingErrors( [ error( EligibilityErrors.NO_BUSINESS_PLAN ) ] );

		assert.match( hold.title, /Business/ );
	} );
} );

describe( 'the Atomic-site-below-Business special case', () => {
	it( 'recognises the pair that would claim a transfer is running', () => {
		assert.equal(
			isAtomicSiteWithoutBusinessPlan( [
				error( EligibilityErrors.TRANSFER_ALREADY_EXISTS ),
				error( EligibilityErrors.NO_BUSINESS_PLAN ),
			] ),
			true
		);
	} );

	it( 'needs both codes, not either', () => {
		assert.equal(
			isAtomicSiteWithoutBusinessPlan( [ error( EligibilityErrors.TRANSFER_ALREADY_EXISTS ) ] ),
			false
		);
		assert.equal(
			isAtomicSiteWithoutBusinessPlan( [ error( EligibilityErrors.NO_BUSINESS_PLAN ) ] ),
			false
		);
	} );
} );

describe( 'the call to action', () => {
	it( 'stays actionable for a site that only needs the plan, which the flow sells', () => {
		assert.equal( needsPlanUpgrade( [ error( EligibilityErrors.NO_BUSINESS_PLAN ) ] ), true );
		assert.equal( canProceed( false, [ error( EligibilityErrors.NO_BUSINESS_PLAN ) ] ), true );
	} );

	it( 'is disabled for a site that cannot transfer at all', () => {
		assert.equal( canProceed( false, [ error( EligibilityErrors.SITE_GRAYLISTED ) ] ), false );
		assert.equal( canProceed( false, [ error( 'is_staging_blog' ) ] ), false );
	} );

	it( 'is enabled for an eligible site', () => {
		assert.equal( canProceed( true, [] ), true );
	} );
} );

describe( 'whether the modal is shown first', () => {
	it( 'skips it for a site with nothing to surface', () => {
		assert.equal( needsConfirmation( true, [], [] ), false );
	} );

	it( 'shows it for a failed check, an error, or a warning', () => {
		assert.equal( needsConfirmation( false, [], [] ), true );
		assert.equal( needsConfirmation( true, [ error( 'is_staging_blog' ) ], [] ), true );
		assert.equal( needsConfirmation( true, [], [ { id: 'wordpress_subdomain' } ] ), true );
	} );
} );
