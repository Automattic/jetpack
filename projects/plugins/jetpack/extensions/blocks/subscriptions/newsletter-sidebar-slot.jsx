import { createSlotFill } from '@wordpress/components';

/**
 * Lets other extensions add content to the Jetpack Newsletter sidebar without
 * the subscriptions extension having to know about them.
 *
 * Import the default export as a Fill; `menu.jsx` renders the Slot.
 */
const { Fill, Slot } = createSlotFill( 'JetpackNewsletterSidebar' );

export { Fill as default, Slot };
