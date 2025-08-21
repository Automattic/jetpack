import type { FullConfig, Reporter, Suite } from '@playwright/test/reporter';

class SuiteFixerReporter implements Reporter {
	onBegin( _config: FullConfig, suite: Suite ) {
		for ( const child of suite.suites ) {
			child.title = `${ process.env.PROJECT_NAME ? `${ process.env.PROJECT_NAME }: ` : '' }${
				child.title
			}`;
		}
	}
}

export default SuiteFixerReporter;
