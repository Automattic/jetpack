import assert from 'node:assert/strict';
import test from 'node:test';
import { renderGuide } from '../plan.mjs';

test( 'renderGuide preserves important callouts on individual sub-tests', () => {
	const guide = {
		sections: [
			{
				title: 'Block Notes',
				related_prs: [ 47976 ],
				important: null,
				context: null,
				steps: [],
				sub_tests: [
					{
						title: 'Big Sky fallback still activates Block Notes',
						related_prs: [ 47296, 47976 ],
						important: 'Requires Big Sky access; skip if you do not have that test site.',
						steps: [ 'Open the editor on a Big Sky site and confirm Block Notes loads.' ],
					},
				],
			},
		],
		other_changes: [],
		flags: {},
	};
	const classifications = [
		{
			pr: 47296,
			title: 'Block Notes fallback',
			engineer_environment: null,
			external_accounts: [],
		},
		{
			pr: 47976,
			title: 'Disable Block Notes',
			engineer_environment: null,
			external_accounts: [],
		},
	];

	const markdown = renderGuide( guide, '15.9', classifications );

	assert.match(
		markdown,
		/> \*\*Important:\*\* Requires Big Sky access; skip if you do not have that test site\./
	);
	assert.match( markdown, /#### Big Sky fallback still activates Block Notes/ );
} );

test( 'renderGuide replaces the placeholder preamble and appends manual release-context sections', () => {
	const guide = {
		sections: [
			{
				title: 'Forms',
				related_prs: [ 47826 ],
				important: null,
				context: null,
				steps: [ 'Open Forms and confirm the inbox loads.' ],
				sub_tests: [],
			},
		],
		other_changes: [],
		flags: {},
	};
	const classifications = [
		{
			pr: 47826,
			title: 'Forms inbox',
			engineer_environment: null,
			external_accounts: [],
		},
	];
	const releaseContext = {
		preamble: 'Release lead context: use the public tester roster in peKye1-1Z1-p2.',
		manual_sections: [
			{
				title: 'Jetpack Connector',
				important: 'Manual cross-repo walkthrough supplied by the release lead.',
				context: 'This coverage comes from release context, not Jetpack changelog PRs.',
				steps: [ 'Follow the connector walkthrough and report mismatches.' ],
			},
		],
	};

	const markdown = renderGuide( guide, '15.9', classifications, { releaseContext } );

	assert.match( markdown, /Release lead context: use the public tester roster in peKye1-1Z1-p2\./ );
	assert.doesNotMatch( markdown, /paste the testing-cycle preamble/ );
	assert.match( markdown, /### Jetpack Connector/ );
	assert.match( markdown, /Manual cross-repo walkthrough supplied by the release lead\./ );
} );
