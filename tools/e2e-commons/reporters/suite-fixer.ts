import type { FullConfig, Reporter, Suite, TestCase } from '@playwright/test/reporter';

class SuiteFixerReporter implements Reporter {
	onBegin( _config: FullConfig, suite: Suite ) {
		if ( process.env.PROJECT_NAME ) {
			suite.title = `${ process.env.PROJECT_NAME }`;
		}

		// Create a new suite as a child of root suite
		const newSuite = ( suite.suites[ 0 ] || {
			title: 'MY Test Suite',
			suites: [],
			tests: [],
			parent: suite,
		} ) as Suite;

		// Move all existing root children into the new second-level suite
		const originalChildren = suite.suites.slice();
		suite.suites.length = 0; // Clear existing suites

		// Add original children to the new suite
		originalChildren.forEach( child => {
			newSuite.suites.push( child );
			child.parent = newSuite;
		} );

		// Add the new suite as the only child of root
		suite.suites.push( newSuite );
		newSuite.parent = suite;

		// Log the title for each suite in the reorganized structure
		suite.suites.forEach( ( s, index ) => {
			const project = s.project();
			const projectName = project ? project.name : 'No project';
			const dependencies =
				project && project.dependencies
					? project.dependencies.map( d => d.name ).join( ', ' )
					: 'None';
			console.log(
				`Suite ${ index }: ${ s.title } (Project: ${ projectName }, Dependencies: ${ dependencies })`
			);

			// Log nested suites
			s.suites.forEach( ( nested, nestedIndex ) => {
				const nestedProject = nested.project();
				const nestedProjectName = nestedProject ? nestedProject.name : 'No project';
				console.log(
					`  Nested Suite ${ nestedIndex }: ${ nested.title } (Project: ${ nestedProjectName })`
				);
			} );
		} );

		console.log();
		console.log( '====' );
		console.log( `>>>> Suite name: ${ suite.title }` );
		console.log( `>>>> Starting the run with ${ suite.allTests().length } tests` );
		console.log( '====' );
		console.log();
	}

	onTestBegin( test: TestCase ) {
		// This helps with reporting the global projects tests as separate tests in Allure.
		// The global projects tests run multiple times in a single run
		// and because all results are merged in a single Allure report these tests are reported as retries instead of separate runs.
		// Adding a parameter for the parent project makes Allure report them as separate tests.
		console.log( `>>>> Test name: ${ test.title }. Test suite: ${ test.parent.title }` );

		if ( process.env.PROJECT_NAME ) {
			let topLevelParent = test.parent;
			while ( topLevelParent.parent ) {
				topLevelParent = topLevelParent.parent;
			}
			topLevelParent.title = process.env.PROJECT_NAME;
		}
	}
}

export default SuiteFixerReporter;
