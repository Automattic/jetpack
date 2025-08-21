import type { FullConfig, Reporter, Suite } from '@playwright/test/reporter';

class SuiteFixerReporter implements Reporter {
	onBegin( _config: FullConfig, suite: Suite ) {
		// If running in CI, prefix suite titles with the project name.
		// This helps to identify the global projects tests in the report.
		// Example: global authentication will run multiple times, for each project that depends on it, but Allure considers it as a single test and will display it as a retry.
		// By updating the suite title, we can ensure that such tests are identifiable in the report.
		for ( const child of suite.suites ) {
			child.title = `${ process.env.PROJECT_NAME ? `${ process.env.PROJECT_NAME }: ` : '' }${
				child.title
			}`;
		}
	}
}

export default SuiteFixerReporter;
