import type { Reporter, TestCase } from '@playwright/test/reporter';

class SuiteFixerReporter implements Reporter {
	onTestBegin( test: TestCase ) {
		// This helps with reporting the global projects tests as separate tests in Allure.
		// The global projects tests run multiple times in a single run
		// and because all results are merged in a single Allure report these tests are reported as retries instead of separate runs.
		// Adding a parameter for the parent project makes Allure report them as separate tests.
		if ( process.env.PROJECT_NAME ) {
			test.parent.title = process.env.PROJECT_NAME;
			// allure.addParameter( 'Parent project', process.env.PROJECT_NAME );
			// allure.parentSuite( process.env.PROJECT_NAME );
		}
	}
}

export default SuiteFixerReporter;
