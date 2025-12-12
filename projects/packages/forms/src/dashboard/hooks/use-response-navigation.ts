import { useDispatch } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { FormResponse } from '../../types/index.ts';
import { getItemId } from '../inbox/utils.js';
import { store as dashboardStore } from '../store/index.js';
import useInboxData from './use-inbox-data.ts';

interface UseResponseNavigationProps {
	record: FormResponse;
}

const useResponseNavigation = ( { record }: UseResponseNavigationProps ) => {
	const { records } = useInboxData();
	const { openResponse } = useDispatch( dashboardStore );
	const currentIndex = useMemo(
		() =>
			record && records
				? records.findIndex( item => getItemId( item ) === getItemId( record ) )
				: -1,
		[ record, records ]
	);

	const hasNext = useMemo(
		() => currentIndex >= 0 && currentIndex < ( records?.length ?? 0 ) - 1,
		[ currentIndex, records ]
	);
	const hasPrevious = useMemo( () => currentIndex > 0, [ currentIndex ] );

	const handleNext = useCallback( () => {
		if ( hasNext && records && currentIndex >= 0 ) {
			const nextItem = records[ currentIndex + 1 ];
			if ( nextItem ) {
				openResponse( nextItem );
			}
		}
	}, [ hasNext, records, currentIndex, openResponse ] );

	const handlePrevious = useCallback( () => {
		if ( hasPrevious && records && currentIndex >= 0 ) {
			const prevItem = records[ currentIndex - 1 ];
			if ( prevItem ) {
				openResponse( prevItem );
			}
		}
	}, [ hasPrevious, records, currentIndex, openResponse ] );

	return {
		currentIndex,
		hasNext,
		hasPrevious,
		handleNext,
		handlePrevious,
	};
};

export default useResponseNavigation;
