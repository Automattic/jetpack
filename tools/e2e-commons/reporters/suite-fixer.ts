import type { FullConfig, FullProject, Reporter, Suite } from '@playwright/test/reporter';

class SuiteFixerReporter implements Reporter {
	onBegin( _config: FullConfig, suite: Suite ) {
		if ( process.env.PROJECT_NAME ) {
			suite.title = `${ process.env.PROJECT_NAME }`;
		}

		// Log the title for each suite in suite.suites
		suite.suites.forEach( ( s, index ) => {
			const project = s.project();
			const projectName = project ? project.name : 'No project';
			const dependencies =
				project && project.dependencies
					? project.dependencies.map( ( d: FullProject ) => d.name ).join( ', ' )
					: 'None';
			console.log(
				`Suite ${ index }: ${ s.title } (Project: ${ projectName }, Dependencies: ${ dependencies })`
			);
		} );

		console.log();
		console.log( '====' );
		console.log( `>>>> Suite name: ${ suite.title }` );
		console.log( `>>>> Starting the run with ${ suite.allTests().length } tests` );
		console.log( '====' );
		console.log();
	}

	// onTestBegin( test: TestCase ) {
	// 	// This helps with reporting the global projects tests as separate tests in Allure.
	// 	// The global projects tests run multiple times in a single run
	// 	// and because all results are merged in a single Allure report these tests are reported as retries instead of separate runs.
	// 	// Adding a parameter for the parent project makes Allure report them as separate tests.
	// 	if ( process.env.PROJECT_NAME ) {
	// 		let topLevelParent = test.parent;
	// 		while ( topLevelParent.parent ) {
	// 			topLevelParent = topLevelParent.parent;
	// 		}
	// 		topLevelParent.title = process.env.PROJECT_NAME;
	// 	}
	// }
}

export default SuiteFixerReporter;
