import { useMemo, useCallback } from '@wordpress/element';
import { FormResponse } from '../../types/index.ts';
import { getItemId } from '../inbox/utils.js';
import useInboxData from './use-inbox-data.ts';

interface UseResponseNavigationProps {
	onChangeSelection: ( responses: string[] ) => void | null;
	record: FormResponse;
	setRecord: ( response: FormResponse ) => void;
	isMobile?: boolean;
}

const useResponseNavigation = ( {
	onChangeSelection,
	record,
	setRecord,
	isMobile = false,
}: UseResponseNavigationProps ) => {
	const { records } = useInboxData();
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
				// Only call setRecord on mobile (where parent's useEffect doesn't run)
				// On desktop, parent's useEffect handles it via onChangeSelection
				if ( isMobile ) {
					setRecord( nextItem );
				}
				onChangeSelection?.( [ getItemId( nextItem ) ] );
			}
		}
	}, [ hasNext, records, currentIndex, isMobile, setRecord, onChangeSelection ] );

	const handlePrevious = useCallback( () => {
		if ( hasPrevious && records && currentIndex >= 0 ) {
			const prevItem = records[ currentIndex - 1 ];
			if ( prevItem ) {
				// Only call setRecord on mobile (where parent's useEffect doesn't run)
				// On desktop, parent's useEffect handles it via onChangeSelection
				if ( isMobile ) {
					setRecord( prevItem );
				}
				onChangeSelection?.( [ getItemId( prevItem ) ] );
			}
		}
	}, [ hasPrevious, records, currentIndex, isMobile, setRecord, onChangeSelection ] );

	return {
		currentIndex,
		hasNext,
		hasPrevious,
		handleNext,
		handlePrevious,
	};
};

export default useResponseNavigation;
