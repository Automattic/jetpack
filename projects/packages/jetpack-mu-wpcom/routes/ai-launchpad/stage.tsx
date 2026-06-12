/**
 * Internal dependencies
 */
import { TailoredList } from '../../src/features/ai-launchpad/js/tailored-list/tailored-list.tsx';
import { Wizard } from '../../src/features/ai-launchpad/js/wizard/wizard.tsx';

/*
 * Owned by Stream A. Other streams replace the bodies of the imported
 * modules; they never edit this file.
 */
const Stage = () => {
	return (
		<>
			<Wizard />
			<TailoredList />
		</>
	);
};

export { Stage as stage };
