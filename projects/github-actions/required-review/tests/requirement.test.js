const Requirement = require( '../src/requirement.js' );

// Reroute `core.info` through `console.info` so `@wordpress/jest-console` can be used.
// Nothing else here is currently used.
jest.mock( '@actions/core', () => ( {
	info: console.info, // eslint-disable-line no-console
} ) );

// Set context to indicate a PR author.
// Nothing else here is currently used.
jest.mock( '@actions/github', () => ( {
	context: {
		payload: {
			pull_request: {
				user: {
					login: 'Author',
				},
			},
		},
	},
} ) );

// Mock the team lookup so we don't have to worry about it trying to query GitHub.
jest.mock( '../src/team-members.js', () => async team => {
	const teams = {
		'some-team': [ 'Author', 'Alice', 'Bob', 'Frank' ],
		women: [ 'Alice', 'Carol' ],
	};

	if ( team.startsWith( '@' ) ) {
		return [ team.slice( 1 ) ];
	}

	if ( teams[ team ] ) {
		return teams[ team ];
	}

	throw new Error( `Mock team ${ team } not found` );
} );

describe( 'Requirement', () => {
	describe( 'appliesToPaths', () => {
		const requirement = new Requirement( {
			paths: [ 'src/foo.php', 'src/bar.php' ],
			teams: [ 'some-team' ],
		} );
		const requirementUnmatched = new Requirement( {
			paths: 'unmatched',
			teams: [ 'some-team' ],
		} );

		test( 'Match', () => {
			expect( requirement.appliesToPaths( [ 'src/bar.php', 'src/baz.php' ], [] ) ).toStrictEqual( {
				applies: true,
				matchedPaths: [ 'src/bar.php' ],
				paths: [ 'src/bar.php', 'src/baz.php' ],
			} );

			expect( console ).toHaveInformedWith(
				[ 'Matches the following files:' ],
				[ '   - src/bar.php' ]
			);
		} );

		test( 'Match, previously matched paths', () => {
			expect(
				requirement.appliesToPaths(
					[ 'src/foo.php', 'src/bar.php', 'src/baz.php', 'src/quux.php' ],
					[ 'src/foo.php', 'src/baz.php' ]
				)
			).toStrictEqual( {
				applies: true,
				matchedPaths: [ 'src/bar.php', 'src/baz.php', 'src/foo.php' ],
				paths: [ 'src/foo.php', 'src/bar.php', 'src/baz.php', 'src/quux.php' ],
			} );

			expect( console ).toHaveInformedWith(
				[ 'Matches the following files:' ],
				[ '   - src/foo.php' ],
				[ '   - src/bar.php' ]
			);
		} );

		test( 'No match', () => {
			expect( requirement.appliesToPaths( [ 'src/baz.php' ], [] ) ).toStrictEqual( {
				applies: false,
				matchedPaths: [],
				paths: [ 'src/baz.php' ],
			} );

			expect( console ).not.toHaveInformed();
		} );

		test( 'No match, previously used paths', () => {
			expect( requirement.appliesToPaths( [ 'src/baz.php' ], [ 'src/xxx.php' ] ) ).toStrictEqual( {
				applies: false,
				matchedPaths: [ 'src/xxx.php' ],
				paths: [ 'src/baz.php' ],
			} );

			expect( console ).not.toHaveInformed();
		} );

		test( 'Consume', () => {
			const requirement2 = new Requirement( {
				paths: [ 'src/foo.php', 'src/bar.php' ],
				teams: [ 'some-team' ],
				consume: true,
			} );

			expect(
				requirement2.appliesToPaths(
					[ 'src/foo.php', 'src/bar.php', 'src/baz.php', 'src/quux.php' ],
					[ 'src/foo.php', 'src/baz.php' ]
				)
			).toStrictEqual( {
				applies: true,
				matchedPaths: [ 'src/bar.php', 'src/baz.php', 'src/foo.php' ],
				paths: [ 'src/baz.php', 'src/quux.php' ],
			} );

			expect( console ).toHaveInformedWith(
				[ 'Matches the following files:' ],
				[ '   - src/foo.php' ],
				[ '   - src/bar.php' ],
				[ 'Consuming matched files!' ]
			);
		} );

		test( 'Unmatched', () => {
			expect(
				requirementUnmatched.appliesToPaths(
					[ 'src/foo.php', 'src/bar.php', 'src/baz.php', 'src/quux.php' ],
					[ 'src/foo.php', 'src/baz.php' ]
				)
			).toStrictEqual( {
				applies: true,
				matchedPaths: [ 'src/bar.php', 'src/baz.php', 'src/foo.php', 'src/quux.php' ],
				paths: [ 'src/foo.php', 'src/bar.php', 'src/baz.php', 'src/quux.php' ],
			} );

			expect( console ).toHaveInformedWith(
				[ 'Matches the following files:' ],
				[ '   - src/bar.php' ],
				[ '   - src/quux.php' ]
			);
		} );

		test( 'Unmatched, but all were matched', () => {
			expect(
				requirementUnmatched.appliesToPaths(
					[ 'src/foo.php', 'src/bar.php', 'src/baz.php', 'src/quux.php' ],
					[ 'src/bar.php', 'src/baz.php', 'src/foo.php', 'src/quux.php' ]
				)
			).toStrictEqual( {
				applies: false,
				matchedPaths: [ 'src/bar.php', 'src/baz.php', 'src/foo.php', 'src/quux.php' ],
				paths: [ 'src/foo.php', 'src/bar.php', 'src/baz.php', 'src/quux.php' ],
			} );

			expect( console ).toHaveInformedWith( [
				"Matches files that haven't been matched yet, but all files have.",
			] );
		} );

		test( 'Negated path', () => {
			const requirement2 = new Requirement( {
				paths: [ '!dist/**', '!src/**', 'src/bar.php' ],
				teams: [ 'some-team' ],
			} );

			expect( requirement2.appliesToPaths( [ 'dist/bar.php', 'src/bar.php' ], [] ) ).toStrictEqual(
				{
					applies: true,
					matchedPaths: [ 'src/bar.php' ],
					paths: [ 'dist/bar.php', 'src/bar.php' ],
				}
			);

			expect( console ).toHaveInformedWith(
				[ 'Matches the following files:' ],
				[ '   - src/bar.php' ]
			);
		} );

		test( 'Negated path, no match', () => {
			const requirement2 = new Requirement( {
				paths: [ '!dist/**', '!src/**', 'src/bar.php' ],
				teams: [ 'some-team' ],
			} );

			expect( requirement2.appliesToPaths( [ 'dist/foo.php', 'src/foo.php' ], [] ) ).toStrictEqual(
				{
					applies: false,
					matchedPaths: [],
					paths: [ 'dist/foo.php', 'src/foo.php' ],
				}
			);

			expect( console ).not.toHaveInformed();
		} );

		test.each( [ undefined, 123, 'bogus', [], [ 'a', 'b', 42 ] ] )( 'Bad path: %p', paths => {
			expect( () => new Requirement( { paths, teams: [ 'some-team' ] } ) ).toThrow(
				'Paths must be a non-empty array of strings, or the string "unmatched".'
			);
		} );
	} );

	describe( 'needsReviewsFrom', () => {
		test( 'Simple team match', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ 'some-team' ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Bob' ] ) ).resolves.toStrictEqual( [] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Members of some-team: Bob' ],
				[ '  => Bob' ]
			);
		} );

		test( 'Simple team, no match', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ 'some-team' ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'David' ] ) ).resolves.toStrictEqual( [
				'some-team',
			] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Members of some-team: <empty set>' ],
				[ '  => <empty set>' ]
			);
		} );

		test( 'Multiple teams match', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ 'some-team', 'women' ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Carol' ] ) ).resolves.toStrictEqual( [] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Members of some-team: <empty set>' ],
				[ '    Members of women: Carol' ],
				[ '  => Carol' ]
			);
		} );

		test( 'Multiple teams, no match', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ 'some-team', 'women' ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'David' ] ) ).resolves.toStrictEqual( [
				'some-team',
				'women',
			] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Members of some-team: <empty set>' ],
				[ '    Members of women: <empty set>' ],
				[ '  => <empty set>' ]
			);
		} );

		test( 'Username match', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ '@David' ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'David' ] ) ).resolves.toStrictEqual( [] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Members of @David: David' ],
				[ '  => David' ]
			);
		} );

		test( 'Username, no match', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ 'some-team', '@David' ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Carol' ] ) ).resolves.toStrictEqual( [
				'some-team',
				'@David',
			] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Members of some-team: <empty set>' ],
				[ '    Members of @David: <empty set>' ],
				[ '  => <empty set>' ]
			);
		} );

		test( 'All-of match by one reviewer', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'all-of': [ 'some-team', 'women' ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Alice' ] ) ).resolves.toStrictEqual( [] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Union of these, if none are empty:' ],
				[ '      Members of some-team: Alice' ],
				[ '      Members of women: Alice' ],
				[ '    => Alice' ],
				[ '  => Alice' ]
			);
		} );

		test( 'All-of match by separate reviewers', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'all-of': [ 'some-team', 'women' ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Bob', 'Carol' ] ) ).resolves.toStrictEqual(
				[]
			);
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Union of these, if none are empty:' ],
				[ '      Members of some-team: Bob' ],
				[ '      Members of women: Carol' ],
				[ '    => Bob, Carol' ],
				[ '  => Bob, Carol' ]
			);
		} );

		test( 'All-of, partial match', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'all-of': [ 'some-team', 'women' ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Bob', 'Frank' ] ) ).resolves.toStrictEqual( [
				'women',
			] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Union of these, if none are empty:' ],
				[ '      Members of some-team: Bob, Frank' ],
				[ '      Members of women: <empty set>' ],
				[ '    => <empty set>' ],
				[ '  => <empty set>' ]
			);
		} );

		test( 'All-of, none match', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'all-of': [ 'some-team', 'women', '@David' ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [] ) ).resolves.toStrictEqual( [
				'some-team',
				'women',
				'@David',
			] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Union of these, if none are empty:' ],
				[ '      Members of some-team: <empty set>' ],
				[ '      Members of women: <empty set>' ],
				[ '      Members of @David: <empty set>' ],
				[ '    => <empty set>' ],
				[ '  => <empty set>' ]
			);
		} );

		test( 'Is-author-or-reviewer, match author', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'is-author-or-reviewer': [ 'some-team' ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [] ) ).resolves.toStrictEqual( [] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Author or reviewers are union of these:' ],
				[ '      Members of some-team: Author' ],
				[ '    => Author' ],
				[ '  => Author' ]
			);
		} );

		test( 'Is-author-or-reviewer, match reviewer', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'is-author-or-reviewer': [ 'women' ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Alice' ] ) ).resolves.toStrictEqual( [] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Author or reviewers are union of these:' ],
				[ '      Members of women: Alice' ],
				[ '    => Alice' ],
				[ '  => Alice' ]
			);
		} );

		test( 'Is-author-or-reviewer, no match', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'is-author-or-reviewer': [ 'women' ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'David' ] ) ).resolves.toStrictEqual( [
				'women',
			] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Author or reviewers are union of these:' ],
				[ '      Members of women: <empty set>' ],
				[ '    => <empty set>' ],
				[ '  => <empty set>' ]
			);
		} );

		test( 'All-of and is-author-or-reviewer, match with author', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'all-of': [ 'some-team', { 'is-author-or-reviewer': [ '@Author' ] } ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Bob' ] ) ).resolves.toStrictEqual( [] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Union of these, if none are empty:' ],
				[ '      Author or reviewers are union of these:' ],
				[ '      Members of some-team: Bob' ],
				[ '        Members of @Author: Author' ],
				[ '      => Author' ],
				[ '    => Bob, Author' ],
				[ '  => Bob, Author' ]
			);
		} );

		test( 'All-of and is-author-or-reviewer, match with reviewer', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'all-of': [ 'some-team', { 'is-author-or-reviewer': [ '@Bob' ] } ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Bob' ] ) ).resolves.toStrictEqual( [] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Union of these, if none are empty:' ],
				[ '      Author or reviewers are union of these:' ],
				[ '      Members of some-team: Bob' ],
				[ '        Members of @Bob: Bob' ],
				[ '      => Bob' ],
				[ '    => Bob' ],
				[ '  => Bob' ]
			);
		} );

		test( 'All-of and is-author-or-reviewer, no match non-author part', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'all-of': [ 'some-team', { 'is-author-or-reviewer': [ '@Author' ] } ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Carol' ] ) ).resolves.toStrictEqual( [
				'some-team',
			] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Union of these, if none are empty:' ],
				[ '      Author or reviewers are union of these:' ],
				[ '      Members of some-team: <empty set>' ],
				[ '        Members of @Author: Author' ],
				[ '      => Author' ],
				[ '    => <empty set>' ],
				[ '  => <empty set>' ]
			);
		} );

		test( 'All-of and is-author-or-reviewer, no match with-author part', async () => {
			const requirement = new Requirement( {
				paths: 'unmatched',
				teams: [ { 'all-of': [ 'some-team', { 'is-author-or-reviewer': [ '@David' ] } ] } ],
			} );
			await expect( requirement.needsReviewsFrom( [ 'Bob' ] ) ).resolves.toStrictEqual( [
				'@David',
			] );
			expect( console ).toHaveInformedWith(
				[ 'Checking reviewers...' ],
				[ '  Union of these:' ],
				[ '    Union of these, if none are empty:' ],
				[ '      Author or reviewers are union of these:' ],
				[ '      Members of some-team: Bob' ],
				[ '        Members of @David: <empty set>' ],
				[ '      => <empty set>' ],
				[ '    => <empty set>' ],
				[ '  => <empty set>' ]
			);
		} );

		test( 'Invalid input: object with non-array value', async () => {
			expect(
				() => new Requirement( { paths: 'unmatched', teams: [ { 'any-of': 42 } ] } )
			).toThrow( 'Expected an array of teams, got number' );
		} );

		test( 'Invalid input: object with empty array value', async () => {
			expect(
				() => new Requirement( { paths: 'unmatched', teams: [ { 'any-of': [] } ] } )
			).toThrow( 'Expected a non-empty array of teams' );
		} );

		test( 'Invalid input: Non-string, non-object in team array', async () => {
			expect(
				() => new Requirement( { paths: 'unmatched', teams: [ { 'any-of': [ 42 ] } ] } )
			).toThrow( 'Expected a team name or a single-keyed object.' );
		} );

		test( 'Invalid input: Object with multiple keys', async () => {
			expect(
				() =>
					new Requirement( {
						paths: 'unmatched',
						teams: [ { 'any-of': [ 'some-team' ], 'all-of': [ 'some-team' ] } ],
					} )
			).toThrow( 'Expected a team name or a single-keyed object.' );
		} );

		test( 'Invalid input: unknown operation', async () => {
			expect(
				() => new Requirement( { paths: 'unmatched', teams: [ { 'is-author': 42 } ] } )
			).toThrow( 'Unrecognized operation "is-author"' );
		} );
	} );
} );
