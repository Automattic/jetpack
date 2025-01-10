/*
 * External dependencies
 */
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';

// TODO: Move to the AI Client js-package
export function getFeatureAvailability( feature: string ): boolean {
	return getJetpackExtensionAvailability( feature ).available === true;
}
