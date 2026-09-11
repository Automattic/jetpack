import { useCallback, useEffect, useRef, useState } from 'react';
import { getHistoryWindow } from './history-days';

export function useHistoryRange() {
	const ref = useRef< HTMLDivElement >( null );
	const [ paging, setPaging ] = useState< { dayCount: 15 | 30; offset: number } >( {
		dayCount: 30,
		offset: 0,
	} );

	useEffect( () => {
		if ( ! ref.current || ! window.matchMedia ) {
			return;
		}
		const query = getComputedStyle( ref.current )
			.getPropertyValue( '--jetpack-boost-history-narrow-query' )
			.trim();
		if ( ! query ) {
			return;
		}
		const media = window.matchMedia( query );
		const update = () => {
			const dayCount = media.matches ? 15 : 30;
			setPaging( current => ( current.dayCount === dayCount ? current : { dayCount, offset: 0 } ) );
		};
		update();
		media.addEventListener( 'change', update );
		return () => media.removeEventListener( 'change', update );
	}, [] );

	const onPrevious = useCallback( () => {
		setPaging( current => ( { ...current, offset: current.offset + 1 } ) );
	}, [] );
	const onNext = useCallback( () => {
		setPaging( current => ( { ...current, offset: Math.max( 0, current.offset - 1 ) } ) );
	}, [] );

	return {
		ref,
		range: getHistoryWindow( paging.offset, new Date(), paging.dayCount ),
		dayCount: paging.dayCount,
		canGoNext: paging.offset > 0,
		onPrevious,
		onNext,
	};
}
