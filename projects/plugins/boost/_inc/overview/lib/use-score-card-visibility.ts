import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export function useScoreCardVisibility( cardRef: RefObject< HTMLDivElement >, enabled: boolean ) {
	const [ slot, setSlot ] = useState< HTMLDivElement | null >( null );
	const [ isAboveViewport, setIsAboveViewport ] = useState( false );

	useEffect( () => {
		const card = cardRef.current;
		const page = card?.closest( '.jp-admin-page__page' );
		if ( ! enabled || ! card || ! page || ! window.IntersectionObserver ) {
			return;
		}
		let root = card.parentElement;
		while ( root && ! /^(auto|scroll)$/.test( getComputedStyle( root ).overflowY ) ) {
			root = root.parentElement;
		}
		if ( ! root ) {
			return;
		}
		const scrollRoot = root;

		const mount = document.createElement( 'div' );
		mount.className = 'jetpack-boost-score-bar-slot';
		page.insertBefore( mount, page.firstElementChild?.nextSibling ?? null );
		setSlot( mount );
		const observer = new IntersectionObserver(
			( [ entry ] ) => {
				setIsAboveViewport(
					! entry.isIntersecting &&
						entry.boundingClientRect.bottom <=
							( entry.rootBounds?.top ?? scrollRoot.getBoundingClientRect().top )
				);
			},
			{ root: scrollRoot, threshold: 0 }
		);
		observer.observe( card );
		return () => {
			observer.disconnect();
			mount.remove();
			setSlot( null );
			setIsAboveViewport( false );
		};
	}, [ cardRef, enabled ] );

	return { slot, isAboveViewport };
}
