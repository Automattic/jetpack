import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHeadlineTiers } from '../prioritize.mjs';

const classification = ( pr, hint = null ) => ( {
	pr,
	title: hint ? `${ hint }: PR ${ pr }` : `Standalone PR ${ pr }`,
	consolidation_hint: hint,
	signals: { user_facing_paths: true },
	testing_instructions_quality: 'structured',
} );

test( 'normalizes Tier 1 to one anchor per headline cluster and enforces target sections', () => {
	const classifications = [
		classification( 101, 'forms' ),
		classification( 102, 'forms' ),
		classification( 201, 'reader' ),
		classification( 202, 'reader' ),
		classification( 301, null ),
		classification( 401, null ),
	];
	const tiers = new Map( classifications.map( c => [ c.pr, 1 ] ) );
	const reasons = new Map( classifications.map( c => [ c.pr, 'ai proposed Tier 1' ] ) );

	const result = normalizeHeadlineTiers( classifications, tiers, reasons, {
		targetSections: 2,
		headlinePrs: new Set(),
	} );

	assert.deepEqual(
		classifications.filter( c => result.tiers.get( c.pr ) === 1 ).map( c => c.pr ),
		[ 101, 201 ]
	);
	assert.equal( result.tiers.get( 102 ), 2 );
	assert.equal( result.tiers.get( 202 ), 2 );
	assert.equal( result.tiers.get( 301 ), 2 );
	assert.equal( result.tiers.get( 401 ), 2 );
	assert.match( result.reasons.get( 102 ), /supporting PR/i );
	assert.match( result.reasons.get( 301 ), /target section budget/i );
} );

test( 'forced headline PRs are preserved as anchors before applying the target budget', () => {
	const classifications = [
		classification( 101, 'forms' ),
		classification( 201, 'reader' ),
		classification( 301, null ),
	];
	const tiers = new Map( classifications.map( c => [ c.pr, 1 ] ) );
	const reasons = new Map( classifications.map( c => [ c.pr, 'ai proposed Tier 1' ] ) );

	const result = normalizeHeadlineTiers( classifications, tiers, reasons, {
		targetSections: 1,
		headlinePrs: new Set( [ 301 ] ),
	} );

	assert.equal( result.tiers.get( 301 ), 1 );
	assert.equal( result.tiers.get( 101 ), 2 );
	assert.equal( result.tiers.get( 201 ), 2 );
	assert.match( result.reasons.get( 301 ), /forced/i );
} );
