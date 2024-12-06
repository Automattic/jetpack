/*
 * External dependencies
 */
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';

export function getFeatureAvailability( feature: string ): boolean {
	return getJetpackExtensionAvailability( feature ).available === true;
}
