import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import { name, settings } from '.';

/*
 * Register the main "social-previews" extension if the feature is available
 * on the current plan.
 */
registerJetpackPlugin( name, settings );
