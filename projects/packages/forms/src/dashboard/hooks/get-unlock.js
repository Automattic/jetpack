import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

export const getUnlock = () => {
	try {
		// See https://github.com/WordPress/gutenberg/issues/66197
		const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
			'@wordpress/edit-site'
		);
		return unlock;
	} catch {
		return undefined;
	}
};
