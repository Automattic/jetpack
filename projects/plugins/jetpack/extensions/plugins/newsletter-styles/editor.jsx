import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import { name, settings } from '.';

// Option C: the standalone email editor screen. Self-mounting — it looks for
// its own container and does nothing on every other admin page.
import './newsletter-email-editor';

registerJetpackPlugin( name, settings );
