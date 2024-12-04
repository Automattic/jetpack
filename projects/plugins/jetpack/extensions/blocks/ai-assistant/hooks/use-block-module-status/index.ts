/*
 * External dependencies
 */
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';

// Maps the block name to the module name.
const blockToModuleMapper = {
	'jetpack/contact-form': 'contact-form',
};

/**
 * Hook that checks if a block's module is active.
 * @param {string} blockName - The block name.
 * @return {boolean} Whether the block can be extended.
 */
export default function useBlockModuleStatus( blockName: string ): boolean {
	const moduleName = blockToModuleMapper[ blockName ];

	const { isModuleActive } = useModuleStatus( moduleName );

	return ! moduleName || isModuleActive;
}
