jest.mock( '@mdn/browser-compat-data', () => ( {
	javascript: {
		feature: {
			a: {
				__compat: {
					support: {
						ff: {
							version_added: '2.0',
						},
					},
				},
			},
			b: {
				__compat: {
					support: {
						ff: {
							version_added: '5.0',
						},
						ie: {
							version_added: '7.0',
						},
					},
				},
			},
			'added-null': {
				__compat: {
					support: {
						ff: {
							version_added: null,
						},
					},
				},
			},
			'added-false': {
				__compat: {
					support: {
						ff: {
							version_added: false,
						},
					},
				},
			},
			'added-true': {
				__compat: {
					support: {
						ff: {
							version_added: true,
						},
					},
				},
			},
			'added-le': {
				__compat: {
					support: {
						ff: {
							version_added: '≤3.0',
						},
					},
				},
			},
			'added-preview': {
				__compat: {
					support: {
						ff: {
							version_added: 'preview',
						},
					},
				},
			},
			'removed-version': {
				__compat: {
					support: {
						ff: {
							version_added: '3.0',
							version_removed: '5.0',
						},
					},
				},
			},
			'removed-true': {
				__compat: {
					support: {
						ff: {
							version_added: '3.0',
							version_removed: true,
						},
					},
				},
			},
			'removed-only': {
				__compat: {
					support: {
						ff: {
							version_added: true,
							version_removed: '5.0',
						},
					},
				},
			},
			// Unclear if this can exist.
			'removed-le': {
				__compat: {
					support: {
						ff: {
							version_added: '3.0',
							version_removed: '≤5.0',
						},
					},
				},
			},
			'removed-preview': {
				__compat: {
					support: {
						ff: {
							version_added: '3.0',
							version_removed: 'preview',
						},
					},
				},
			},
			complex: {
				__compat: {
					support: {
						ff: [
							// Formally added in 10.2, and backported to 9.6 as well.
							{
								version_added: '10.2',
							},
							{
								version_added: '9.6',
								version_removed: '10.0',
							},
							// Before that, there was a partial implementation.
							{
								version_added: '9.0',
								partial_implementation: true,
							},
							// Before that, there was a flagged implementation.
							{
								version_added: '8.0',
								flags: [
									{
										type: 'preference',
										name: 'unprefixed-foobar',
										value_to_set: 'true',
									},
								],
							},
							// Before that, there was a prefixed implementation.
							{
								version_added: '7.0',
								prefix: 'webkit',
							},
							// Before that, there was an implementation under a different name
							{
								version_added: '6.0',
								version_removed: '8.0',
								alternative_name: 'complicated',
							},
						],
					},
				},
			},
		},
		builtins: {
			x: {
				__compat: {
					support: {
						ff: {
							version_added: '1.0',
						},
					},
				},
			},
		},
	},
} ) );
jest.mock( '../src/rulesMap.js', () => ( {
	'rule-is-true': true,
	'rule-is-false': false,
	'rule-with-one-path': 'javascript.feature.a',
	'rule-with-one-path-b': 'javascript.feature.b',
	'rule-with-two-paths': [ 'javascript.feature.a', 'javascript.feature.b' ],
	'rule-with-builtins': [ 'javascript.feature.a', 'javascript.builtins.x' ],
	'rule-with-bad-path': 'javascript.feature.x',
	'rule-with-one-bad-path': [ 'javascript.feature.x', 'javascript.feature.a' ],
	'rule-with-bad-path-b': 'javascript.feature',
	'no-data': 'javascript.feature.added-null',
	'no-data-2': [ 'javascript.feature.added-null', 'javascript.feature.a' ],
	'no-support': 'javascript.feature.added-false',
	'all-support': 'javascript.feature.added-true',
	'all-support-2': [ 'javascript.feature.added-true', 'javascript.feature.a' ],
	'le-support': 'javascript.feature.added-le',
	'le-support-2': [ 'javascript.feature.added-le', 'javascript.feature.a' ],
	'preview-support': 'javascript.feature.added-preview',
	removed: 'javascript.feature.removed-version',
	'removed-only': 'javascript.feature.removed-only',
	'removed-true': 'javascript.feature.removed-true',
	'removed-le': 'javascript.feature.removed-le',
	'removed-preview': 'javascript.feature.removed-preview',
	'complex-support': 'javascript.feature.complex',
} ) );

const mockDebug = jest.fn();
mockDebug.enabled = true;
jest.mock(
	'debug',
	() => name => ( name.startsWith( '@automattic/eslint-config-target-es' ) ? mockDebug : () => {} )
);
beforeEach( () => {
	mockDebug.mockClear();
} );

const { needsCheck } = require( '../src/needsCheck.js' );

describe( 'needsCheck', () => {
	test( 'Rule mapped to true', () => {
		expect( needsCheck( 'rule-is-true', { ff: [ '10.0.0' ] } ) ).toBe( true );
		expect( mockDebug ).not.toHaveBeenCalled();
	} );

	test( 'Rule mapped to false', () => {
		expect( needsCheck( 'rule-is-false', { ff: [ '10.0.0' ] } ) ).toBe( false );
		expect( mockDebug ).not.toHaveBeenCalled();
	} );

	describe( 'Rule mapped to a single path', () => {
		test( 'Browser is new enough', () => {
			expect( needsCheck( 'rule-with-one-path', { ff: [ '10.0.0' ] } ) ).toBe( false );
			expect( mockDebug ).not.toHaveBeenCalled();
		} );
		test( 'Browser is too old', () => {
			expect( needsCheck( 'rule-with-one-path', { ff: [ '1.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 1.0.0 needs check for rule-with-one-path (javascript.feature.a); outside range >= 2.0.0'
			);
		} );
	} );

	test( 'Old-style browser list', () => {
		expect( needsCheck( 'rule-with-one-path', { ff: '10.0.0' } ) ).toBe( false );
		expect( mockDebug ).not.toHaveBeenCalled();

		expect( needsCheck( 'rule-with-one-path', { ff: '1.0.0' } ) ).toBe( true );
		expect( mockDebug ).toHaveBeenCalledTimes( 1 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'ff 1.0.0 needs check for rule-with-one-path (javascript.feature.a); outside range >= 2.0.0'
		);
	} );

	describe( 'Multiple browsers', () => {
		test( 'Both supported', () => {
			expect( needsCheck( 'rule-with-one-path-b', { ff: [ '10.0.0' ], ie: [ '10.0.0' ] } ) ).toBe(
				false
			);
			expect( mockDebug ).not.toHaveBeenCalled();
		} );
		test( 'Only first supported', () => {
			expect( needsCheck( 'rule-with-one-path-b', { ff: [ '10.0.0' ], ie: [ '1.0.0' ] } ) ).toBe(
				true
			);
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ie 1.0.0 needs check for rule-with-one-path-b (javascript.feature.b); outside range >= 7.0.0'
			);
		} );
		test( 'Only second supported', () => {
			expect( needsCheck( 'rule-with-one-path-b', { ff: [ '1.0.0' ], ie: [ '10.0.0' ] } ) ).toBe(
				true
			);
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 1.0.0 needs check for rule-with-one-path-b (javascript.feature.b); outside range >= 5.0.0'
			);
		} );
		test( 'Neither supported', () => {
			expect( needsCheck( 'rule-with-one-path-b', { ff: [ '1.0.0' ], ie: [ '1.0.0' ] } ) ).toBe(
				true
			);
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 1.0.0 needs check for rule-with-one-path-b (javascript.feature.b); outside range >= 5.0.0'
			);
		} );
	} );

	describe( 'Rule mapped to multiple paths', () => {
		test( 'Browser is new enough', () => {
			expect( needsCheck( 'rule-with-two-paths', { ff: [ '10.0.0' ] } ) ).toBe( false );
			expect( mockDebug ).not.toHaveBeenCalled();
		} );
		test( 'Browser is too old for both', () => {
			expect( needsCheck( 'rule-with-two-paths', { ff: [ '1.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 1.0.0 needs check for rule-with-two-paths (javascript.feature.a); outside range >= 2.0.0'
			);
		} );
		test( 'Browser is too old for one', () => {
			expect( needsCheck( 'rule-with-two-paths', { ff: [ '2.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 2.0.0 needs check for rule-with-two-paths (javascript.feature.b); outside range >= 5.0.0'
			);
		} );
	} );

	describe( 'builtins option', () => {
		test( 'true', () => {
			expect( needsCheck( 'rule-with-two-paths', { ff: [ '1.0.0' ] }, { builtins: true } ) ).toBe(
				false
			);
			expect( mockDebug ).not.toHaveBeenCalled();
			expect( needsCheck( 'rule-with-builtins', { ff: [ '1.0.0' ] }, { builtins: true } ) ).toBe(
				true
			);
		} );
		test( 'false', () => {
			expect( needsCheck( 'rule-with-builtins', { ff: [ '1.0.0' ] }, { builtins: false } ) ).toBe(
				false
			);
			expect( mockDebug ).not.toHaveBeenCalled();
			expect( needsCheck( 'rule-with-two-paths', { ff: [ '1.0.0' ] }, { builtins: false } ) ).toBe(
				true
			);
		} );
	} );

	test( 'Rule with bad path', () => {
		expect( needsCheck( 'rule-with-bad-path', { ff: [ '1.0.0' ] } ) ).toBe( false );
		expect( mockDebug ).toHaveBeenCalledTimes( 1 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'Invalid feature map for rule rule-with-bad-path: javascript.feature.x does not exist'
		);
	} );

	test( 'Rule with one bad path', () => {
		expect( needsCheck( 'rule-with-one-bad-path', { ff: [ '1.0.0' ] } ) ).toBe( true );
		expect( mockDebug ).toHaveBeenCalledTimes( 2 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'Invalid feature map for rule rule-with-one-bad-path: javascript.feature.x does not exist'
		);
		expect( mockDebug ).toHaveBeenCalledWith(
			'ff 1.0.0 needs check for rule-with-one-bad-path (javascript.feature.a); outside range >= 2.0.0'
		);

		mockDebug.mockClear();
		expect( needsCheck( 'rule-with-one-bad-path', { ff: [ '10.0.0' ] } ) ).toBe( false );
		expect( mockDebug ).toHaveBeenCalledTimes( 1 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'Invalid feature map for rule rule-with-one-bad-path: javascript.feature.x does not exist'
		);
	} );

	test( 'Rule with bad path (2)', () => {
		expect( needsCheck( 'rule-with-bad-path-b', { ff: [ '1.0.0' ] } ) ).toBe( false );
		expect( mockDebug ).toHaveBeenCalledTimes( 1 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'Invalid feature map for rule rule-with-bad-path-b: No data at javascript.feature'
		);
	} );

	describe( 'No data for browser', () => {
		test( 'Single path', () => {
			expect( needsCheck( 'rule-with-one-path', { ie: [ '10.0.0' ] } ) ).toBe( false );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'No support data for ie for rule rule-with-one-path (javascript.feature.a), skipping'
			);
		} );
		test( 'Multiple paths', () => {
			expect( needsCheck( 'rule-with-two-paths', { ie: [ '10.0.0' ] } ) ).toBe( false );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'No support data for ie for rule rule-with-two-paths (javascript.feature.a), skipping'
			);

			mockDebug.mockClear();
			expect( needsCheck( 'rule-with-two-paths', { ie: [ '6.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 2 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'No support data for ie for rule rule-with-two-paths (javascript.feature.a), skipping'
			);
			expect( mockDebug ).toHaveBeenCalledWith(
				'ie 6.0.0 needs check for rule-with-two-paths (javascript.feature.b); outside range >= 7.0.0'
			);
		} );
	} );

	test( 'No support data', () => {
		expect( needsCheck( 'no-data', { ff: [ '1.0.0' ] } ) ).toBe( false );
		expect( mockDebug ).toHaveBeenCalledTimes( 1 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'No support data for ff for rule no-data (javascript.feature.added-null), skipping'
		);

		mockDebug.mockClear();
		expect( needsCheck( 'no-data-2', { ff: [ '1.0.0' ] } ) ).toBe( true );
		expect( mockDebug ).toHaveBeenCalledTimes( 2 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'No support data for ff for rule no-data-2 (javascript.feature.added-null), skipping'
		);
		expect( mockDebug ).toHaveBeenCalledWith(
			'ff 1.0.0 needs check for no-data-2 (javascript.feature.a); outside range >= 2.0.0'
		);
	} );

	test( 'No support', () => {
		expect( needsCheck( 'no-support', { ff: [ '1.0.0' ] } ) ).toBe( true );
		expect( mockDebug ).toHaveBeenCalledTimes( 1 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'ff 1.0.0 needs check for no-support (javascript.feature.added-false); no support'
		);
	} );

	test( 'Version added === true', () => {
		expect( needsCheck( 'all-support', { ff: [ '1.0.0' ] } ) ).toBe( false );
		expect( mockDebug ).not.toHaveBeenCalled();

		mockDebug.mockClear();
		expect( needsCheck( 'all-support-2', { ff: [ '1.0.0' ] } ) ).toBe( true );
		expect( mockDebug ).toHaveBeenCalledTimes( 1 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'ff 1.0.0 needs check for all-support-2 (javascript.feature.a); outside range >= 2.0.0'
		);
	} );

	test( 'Version added with ≤', () => {
		expect( needsCheck( 'le-support', { ff: [ '1.0.0' ] } ) ).toBe( false );
		expect( mockDebug ).not.toHaveBeenCalled();

		mockDebug.mockClear();
		expect( needsCheck( 'le-support-2', { ff: [ '1.0.0' ] } ) ).toBe( true );
		expect( mockDebug ).toHaveBeenCalledTimes( 1 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'ff 1.0.0 needs check for le-support-2 (javascript.feature.a); outside range >= 2.0.0'
		);
	} );

	test( 'Version added is "preview"', () => {
		expect( needsCheck( 'preview-support', { ff: [ '1000.1000.1000' ] } ) ).toBe( true );
		expect( mockDebug ).toHaveBeenCalledTimes( 1 );
		expect( mockDebug ).toHaveBeenCalledWith(
			'ff 1000.1000.1000 needs check for preview-support (javascript.feature.added-preview); added version is "preview"'
		);
	} );

	describe( 'Version removed', () => {
		test( 'Browser too old', () => {
			expect( needsCheck( 'removed', { ff: [ '1.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 1.0.0 needs check for removed (javascript.feature.removed-version); outside range 3.0.0 – <5.0.0'
			);
		} );
		test( 'Browser ok', () => {
			expect( needsCheck( 'removed', { ff: [ '3.0.0' ] } ) ).toBe( false );
			expect( mockDebug ).not.toHaveBeenCalled();
		} );
		test( 'Browser too new', () => {
			expect( needsCheck( 'removed', { ff: [ '5.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 5.0.0 needs check for removed (javascript.feature.removed-version); outside range 3.0.0 – <5.0.0'
			);
		} );

		test( 'Only a removed version, browser ok', () => {
			expect( needsCheck( 'removed-only', { ff: [ '1.0.0' ] } ) ).toBe( false );
			expect( mockDebug ).not.toHaveBeenCalled();
		} );
		test( 'Only a removed version, browser too new', () => {
			expect( needsCheck( 'removed-only', { ff: [ '5.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 5.0.0 needs check for removed-only (javascript.feature.removed-only); outside range 0.0.0 – <5.0.0'
			);
		} );

		test( 'removed === true', () => {
			expect( needsCheck( 'removed-true', { ff: [ '10.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 10.0.0 needs check for removed-true (javascript.feature.removed-true); outside range 3.0.0 – <0.0.0'
			);
		} );

		test( 'removed with ≤', () => {
			expect( needsCheck( 'removed-le', { ff: [ '10.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 10.0.0 needs check for removed-le (javascript.feature.removed-le); outside range 3.0.0 – <0.0.0'
			);
		} );

		test( 'removed is "preview"', () => {
			expect( needsCheck( 'removed-preview', { ff: [ '10.0.0' ] } ) ).toBe( false );
			expect( mockDebug ).not.toHaveBeenCalled();
		} );

		describe( 'Multiple browser versions', () => {
			test( 'Both supported', () => {
				expect( needsCheck( 'removed', { ff: [ '3.0.0', '4.0.0' ] } ) ).toBe( false );
				expect( mockDebug ).not.toHaveBeenCalled();
			} );
			test( 'Only first supported', () => {
				expect( needsCheck( 'removed', { ff: [ '4.0.0', '5.0.0' ] } ) ).toBe( true );
				expect( mockDebug ).toHaveBeenCalledTimes( 1 );
				expect( mockDebug ).toHaveBeenCalledWith(
					'ff 5.0.0 needs check for removed (javascript.feature.removed-version); outside range 3.0.0 – <5.0.0'
				);
			} );
			test( 'Only second supported', () => {
				expect( needsCheck( 'removed', { ff: [ '2.0.0', '3.0.0' ] } ) ).toBe( true );
				expect( mockDebug ).toHaveBeenCalledTimes( 1 );
				expect( mockDebug ).toHaveBeenCalledWith(
					'ff 2.0.0 needs check for removed (javascript.feature.removed-version); outside range 3.0.0 – <5.0.0'
				);
			} );
			test( 'Neither supported', () => {
				expect( needsCheck( 'removed', { ff: [ '2.0.0', '5.0.0' ] } ) ).toBe( true );
				expect( mockDebug ).toHaveBeenCalledTimes( 1 );
				expect( mockDebug ).toHaveBeenCalledWith(
					'ff 2.0.0 needs check for removed (javascript.feature.removed-version); outside range 3.0.0 – <5.0.0'
				);
			} );
		} );
	} );

	describe( 'Complex support history', () => {
		test( 'Supported in 10.2', () => {
			expect( needsCheck( 'complex-support', { ff: [ '10.2.0' ] } ) ).toBe( false );
			expect( mockDebug ).not.toHaveBeenCalled();
		} );
		test( 'Partial support in 10.0', () => {
			expect( needsCheck( 'complex-support', { ff: [ '10.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 10.0.0 needs check for complex-support (javascript.feature.complex); partial implementation for >= 9.0.0; flagged implementation for >= 8.0.0; prefixed implementation for >= 7.0.0'
			);
		} );
		test( 'Supported in 9.6', () => {
			expect( needsCheck( 'complex-support', { ff: [ '9.6.0' ] } ) ).toBe( false );
			expect( mockDebug ).not.toHaveBeenCalled();
		} );
		test( 'Partial support in 9.0', () => {
			expect( needsCheck( 'complex-support', { ff: [ '9.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 9.0.0 needs check for complex-support (javascript.feature.complex); partial implementation for >= 9.0.0; flagged implementation for >= 8.0.0; prefixed implementation for >= 7.0.0'
			);
		} );
		test( 'Flagged in 8.0', () => {
			expect( needsCheck( 'complex-support', { ff: [ '8.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 8.0.0 needs check for complex-support (javascript.feature.complex); flagged implementation for >= 8.0.0; prefixed implementation for >= 7.0.0'
			);
		} );
		test( 'Prefixed in 7.0', () => {
			expect( needsCheck( 'complex-support', { ff: [ '7.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 7.0.0 needs check for complex-support (javascript.feature.complex); prefixed implementation for >= 7.0.0; alternatively named implementation for 6.0.0 – <8.0.0'
			);
		} );
		test( 'Alternative name in 6.0', () => {
			expect( needsCheck( 'complex-support', { ff: [ '6.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 6.0.0 needs check for complex-support (javascript.feature.complex); alternatively named implementation for 6.0.0 – <8.0.0'
			);
		} );
		test( 'Not supported at all in 5.0', () => {
			expect( needsCheck( 'complex-support', { ff: [ '5.0.0' ] } ) ).toBe( true );
			expect( mockDebug ).toHaveBeenCalledTimes( 1 );
			expect( mockDebug ).toHaveBeenCalledWith(
				'ff 5.0.0 needs check for complex-support (javascript.feature.complex); outside range >= 10.2.0; outside range 9.6.0 – <10.0.0; outside range >= 9.0.0; outside range >= 8.0.0; outside range >= 7.0.0; outside range 6.0.0 – <8.0.0'
			);
		} );
	} );
} );
