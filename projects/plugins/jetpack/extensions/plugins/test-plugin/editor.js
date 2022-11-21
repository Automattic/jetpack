import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import { name, settings } from '.';
registerJetpackPlugin( name, settings );

console.log( 'test-plugin/editor.js' ); // this runs
