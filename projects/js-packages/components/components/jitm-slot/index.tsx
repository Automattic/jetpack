import clsx from 'clsx';
import './style.scss';
import type { JitmSlotProps } from './types.ts';
import type { FC } from 'react';

/**
 * The element a Jetpack in-dashboard message (JITM) is moved into.
 *
 * wp-build's page template hides every direct child of `#wpbody-content` except the
 * app root, so a JITM printed on `admin_notices` is invisible. The JITM script looks
 * for `#jp-admin-notices` and re-parents its card there, which is how a message
 * escapes that rule — a third-party notice has no such step and stays hidden.
 *
 * Render this once, in the shell that survives navigation, above the content. That
 * holds whether the dashboard uses tabs, routes or a DataViews table: it is a normal
 * block-level sibling and needs no height handling.
 *
 * Spacing belongs to the card, never to this element, because the slot is always in
 * the DOM and empty on most page loads. `style.scss` owns that; pass `className` for
 * width and alignment only.
 *
 * @param {JitmSlotProps} props - Component props.
 * @return {JSX.Element} The slot.
 */
const JitmSlot: FC< JitmSlotProps > = ( { className } ) => (
	<div
		id="jp-admin-notices"
		className={ clsx( 'jp-jitm-slot', className ) }
		data-testid="jp-jitm-slot"
	/>
);

export default JitmSlot;
