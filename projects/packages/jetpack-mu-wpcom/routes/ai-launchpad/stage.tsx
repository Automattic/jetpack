/**
 * Internal dependencies
 */
import { App } from '../../src/features/ai-launchpad/js/app.tsx';

/*
 * The wp-build route entry. The orchestration host (`App`) decides whether to
 * show the wizard or the tailored list and handles the transition between them.
 */
const Stage = () => {
	return <App />;
};

export { Stage as stage };
