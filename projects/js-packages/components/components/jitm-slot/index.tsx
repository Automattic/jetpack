import clsx from 'clsx';
import './style.scss';
import type { JitmSlotProps } from './types.ts';
import type { FC } from 'react';

/**
 * The element the JITM script re-parents its card into.
 *
 * Render once, in the shell that survives navigation, above the content. It is a
 * plain block-level sibling, so tabs, routes and DataViews all take the same shape.
 * `className` is for width and alignment; `style.scss` owns spacing.
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
