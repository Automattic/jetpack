import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';
import './style.scss';
import type { JitmSlotProps } from './types.ts';
import type { FC } from 'react';

const NOTICES_ID = 'jp-admin-notices';

/**
 * Returns the page's one `#jp-admin-notices`, creating it on first use.
 *
 * Found through the DOM, not a module variable: each wp-build route bundles its own copy
 * of this module.
 *
 * @return {HTMLElement} The element.
 */
const getNotices = (): HTMLElement => {
	let element = document.getElementById( NOTICES_ID );
	if ( ! element ) {
		element = document.createElement( 'div' );
		element.id = NOTICES_ID;
	}
	return element;
};

/**
 * Hosts the element the JITM script re-parents its card into.
 *
 * The JITM script places its card once per page load, so the element outlives any
 * one slot: an unmounted slot parks it, hidden, and the next slot takes it back.
 * `className` is for width and alignment; `style.scss` owns spacing.
 *
 * @param {JitmSlotProps} props - Component props.
 * @return {JSX.Element} The slot.
 */
const JitmSlot: FC< JitmSlotProps > = ( { className, inset } ) => {
	const ref = useRef< HTMLDivElement >( null );

	useLayoutEffect( () => {
		const host = ref.current;
		if ( ! host ) {
			return;
		}

		const element = getNotices();
		element.hidden = false;
		host.appendChild( element );

		return () => {
			// A slot that mounted before this one unmounted may already hold it.
			if ( element.parentNode === host ) {
				element.hidden = true;
				document.body.appendChild( element );
			}
		};
	}, [] );

	return (
		<div
			ref={ ref }
			className={ clsx( 'jp-jitm-slot', { 'jp-jitm-slot--inset': inset }, className ) }
			data-testid="jp-jitm-slot"
		/>
	);
};

export default JitmSlot;
