import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';
import './style.scss';
import type { JitmSlotProps } from './types.ts';
import type { JSX, FC } from 'react';

const NOTICES_ID = 'jp-admin-notices';

/**
 * Returns the page's shared `#jp-admin-notices`, creating it on first use.
 *
 * Found through the DOM, not a module variable: each wp-build route bundles its own copy
 * of this module. Another admin shell app's own container is not the shared one.
 *
 * @param {HTMLElement} host - The slot's element.
 * @return {HTMLElement} The element.
 */
const getNotices = ( host: HTMLElement ): HTMLElement => {
	const app = host.closest( '[data-shell-page]' );
	let element = Array.from(
		document.querySelectorAll< HTMLElement >( `[id="${ NOTICES_ID }"]` )
	).find( candidate => {
		const owner = candidate.closest( '[data-shell-page]' );
		return 'jitmSlot' in candidate.dataset || ! owner || owner === app;
	} );
	if ( ! element ) {
		element = document.createElement( 'div' );
		element.id = NOTICES_ID;
	}
	element.dataset.jitmSlot = '';
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

		const element = getNotices( host );
		element.hidden = false;
		host.appendChild( element );

		// The admin shell keeps hidden apps mounted: take the element back when this slot's app is shown.
		const onShown = ( event: Event ) => {
			const app = host.closest( '[data-shell-page]' );
			const notices = getNotices( host );
			if (
				app?.getAttribute( 'data-shell-page' ) === ( event as CustomEvent ).detail?.page &&
				! app.contains( notices )
			) {
				notices.hidden = false;
				host.appendChild( notices );
			}
		};
		window.addEventListener( 'jetpack-admin-shell:page-shown', onShown );

		return () => {
			window.removeEventListener( 'jetpack-admin-shell:page-shown', onShown );
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
