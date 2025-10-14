import { useMemo, useCallback } from '@wordpress/element';
import { FormResponse } from '../../types';
import { getItemId } from '../inbox/utils';

interface UseResponseNavigationProps {
	data: FormResponse[];
	onChangeSelection: ( responses: string[] ) => void | null;
	record: FormResponse;
	setRecord: ( response: FormResponse ) => void;
}

const useResponseNavigation = ( {
	data,
	onChangeSelection,
	record,
	setRecord,
}: UseResponseNavigationProps ) => {
	const currentIndex = useMemo(
		() =>
			record && data ? data.findIndex( item => getItemId( item ) === getItemId( record ) ) : -1,
		[ record, data ]
	);

	const hasNext = currentIndex >= 0 && currentIndex < ( data?.length ?? 0 ) - 1;
	const hasPrevious = currentIndex > 0;

	const handleNext = useCallback( () => {
		if ( hasNext && data && currentIndex >= 0 ) {
			const nextItem = data[ currentIndex + 1 ];
			if ( nextItem ) {
				setRecord( nextItem );
				onChangeSelection?.( [ getItemId( nextItem ) ] );
			}
		}
	}, [ hasNext, data, currentIndex, setRecord, onChangeSelection ] );

	const handlePrevious = useCallback( () => {
		if ( hasPrevious && data && currentIndex >= 0 ) {
			const prevItem = data[ currentIndex - 1 ];
			if ( prevItem ) {
				setRecord( prevItem );
				onChangeSelection?.( [ getItemId( prevItem ) ] );
			}
		}
	}, [ hasPrevious, data, currentIndex, setRecord, onChangeSelection ] );

	return {
		currentIndex,
		hasNext,
		hasPrevious,
		handleNext,
		handlePrevious,
	};
};

export default useResponseNavigation;
