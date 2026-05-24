import assert from 'node:assert/strict';
import test from 'node:test';
import { findNarrativeLosses, validateDecisionEffects } from '../process-gates.mjs';

test( 'decision-effect validation fails when an accepted split does not reshape sections', () => {
	const decisionAnswers = [
		{
			pr_numbers: [ 47313, 47417, 47418, 47840, 47903, 47912 ],
			summary: 'Settings section absorbs unrelated admin UI changes.',
			answer:
				"Split into two sections: 'Settings page modernization' (47490, 47656, 47942) and 'Jetpack admin UI: menu, footer, network admin' (47313, 47417, 47418, 47840, 47903, 47912)",
		},
	];
	const guide = {
		sections: [
			{
				title: 'Settings: admin page modernization',
				related_prs: [ 47313, 47417, 47418, 47840, 47903, 47912 ],
				sub_tests: [],
			},
		],
	};

	const failures = validateDecisionEffects( decisionAnswers, guide );

	assert.equal( failures.length, 1 );
	assert.match( failures[ 0 ].summary, /expected section/i );
	assert.match( failures[ 0 ].summary, /Settings page modernization/ );
} );

test( 'decision-effect validation catches fabricated commands that should have been removed', () => {
	const decisionAnswers = [
		{
			pr_numbers: [ 47102 ],
			summary: 'Forms abilities sub-test fabricated WP-CLI commands.',
			answer:
				'Remove fabricated commands; fall back to composer test-php tests/php/abilities/Forms_Abilities_Test.php.',
		},
	];
	const guide = {
		sections: [
			{
				title: 'Forms',
				related_prs: [ 47102 ],
				steps: [ 'Run `wp ability list` and then `wp ability run forms.get`.' ],
			},
		],
	};

	const failures = validateDecisionEffects( decisionAnswers, guide );

	assert.equal( failures.length, 1 );
	assert.match( failures[ 0 ].summary, /fabricated command/i );
} );

test( 'narrative-loss validation flags baseline named coverage demoted to Other PRs', () => {
	const currentClassifications = [
		{
			pr: 46342,
			title: 'Command Palette: Site switcher',
			signals: { user_facing_paths: true },
			placement: { kind: 'other_changes_auto' },
			excluded_by_user: false,
		},
	];
	const baselineClassifications = [
		{
			pr: 46342,
			title: 'Command Palette: Site switcher',
			placement: { kind: 'section', title: 'Command Palette and site switching' },
		},
	];

	const losses = findNarrativeLosses( currentClassifications, baselineClassifications );

	assert.equal( losses.length, 1 );
	assert.equal( losses[ 0 ].pr, 46342 );
	assert.match( losses[ 0 ].summary, /Command Palette and site switching/ );
} );
