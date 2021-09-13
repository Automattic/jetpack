/**
 * Internal dependencies
 */
import registerJetpackPlugin from '../shared/register-jetpack-plugin';

/*
 * Jetpack core-editor plugins dependencies
 */
import { name as publicizePluginName, settings as publicizePluginSettings } from './publicize';
import { name as sharingPluginName, settings as sharingPluginSettings } from './sharing';

/*
 * Register plugins.
 * Order matters. The plugins will be registered in the order they are listed here,
 * impacting the order in which they are rendered in the UI.
 *
 * https://github.com/Automattic/jetpack/issues/21036
 */
registerJetpackPlugin( publicizePluginName, publicizePluginSettings );
registerJetpackPlugin( sharingPluginName, sharingPluginSettings );
