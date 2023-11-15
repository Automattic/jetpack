import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

/**
 * Get a list of additional connections that are supported by the current plan.
 *
 * @returns {Array<string>} A list of connection names
 */
export function getSupportedAdditionalConnections() {
	return getJetpackData()?.social?.supportedAdditionalConnections || [];
}
