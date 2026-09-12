import { useViewportMatch } from '@wordpress/compose';
import { useCallback, useEffect, useState } from 'react';
import { getHistoryWindow } from './history-days';

export function useHistoryRange() {
	const isNarrow = useViewportMatch( 'small', '<' );
	const [ paging, setPaging ] = useState< { dayCount: 15 | 30; offset: number } >( {
		dayCount: isNarrow ? 15 : 30,
		offset: 0,
	} );

	useEffect( () => {
		const dayCount = isNarrow ? 15 : 30;
		setPaging( current => ( current.dayCount === dayCount ? current : { dayCount, offset: 0 } ) );
	}, [ isNarrow ] );

	const onPrevious = useCallback( () => {
		setPaging( current => ( { ...current, offset: current.offset + 1 } ) );
	}, [] );
	const onNext = useCallback( () => {
		setPaging( current => ( { ...current, offset: Math.max( 0, current.offset - 1 ) } ) );
	}, [] );

	return {
		range: getHistoryWindow( paging.offset, new Date(), paging.dayCount ),
		dayCount: paging.dayCount,
		canGoNext: paging.offset > 0,
		onPrevious,
		onNext,
	};
}
