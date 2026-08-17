import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import { name, settings } from '.';

// Options C and D: the standalone screens. Both are self-mounting — each looks
// for its own container and does nothing on every other admin page.
import './newsletter-email-editor';
import './newsletter-styles-page';

registerJetpackPlugin( name, settings );
