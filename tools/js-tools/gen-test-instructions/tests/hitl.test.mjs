import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveNonInteractiveDecisions } from '../hitl.mjs';

test( 'non-interactive decisions do not auto-apply conditional recommended options', () => {
	const decisions = [
		{
			pr_numbers: [ 46583 ],
			summary: 'The Social section has no important callout.',
			options: [
				'Add an important callout. If the engineer_environment label looks wrong, correct the classification rather than fabricate a requirement.',
				'Accept the guide as-is.',
			],
			recommended_option: 1,
		},
	];

	const result = resolveNonInteractiveDecisions( decisions );

	assert.deepEqual( result.answers, [] );
	assert.equal( result.unresolved.length, 1 );
	assert.equal( result.unresolved[ 0 ].pr_numbers[ 0 ], 46583 );
	assert.match( result.unresolved[ 0 ].reason, /conditional/i );
} );

test( 'non-interactive decisions still auto-apply concrete recommended options', () => {
	const decisions = [
		{
			pr_numbers: [ 47614 ],
			summary: 'A block inserter cleanup is hidden in the Forms test.',
			options: [
				"Move 47614 into its own sub-test titled 'Block inserter: Jetpack collection removed' under 'Other tester-facing fixes'.",
				'Leave it where it is.',
			],
			recommended_option: 1,
		},
	];

	const result = resolveNonInteractiveDecisions( decisions );

	assert.equal( result.unresolved.length, 0 );
	assert.deepEqual( result.answers, [
		{
			pr_numbers: [ 47614 ],
			summary: 'A block inserter cleanup is hidden in the Forms test.',
			answer:
				"Move 47614 into its own sub-test titled 'Block inserter: Jetpack collection removed' under 'Other tester-facing fixes'.",
			expected_effects: [],
		},
	] );
} );
