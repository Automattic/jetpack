import { useMemo, useCallback } from '@wordpress/element';
import { FormResponse } from '../../types';
import { getItemId } from '../inbox/utils';
import useInboxData from './use-inbox-data';

interface UseResponseNavigationProps {
	onChangeSelection: ( responses: string[] ) => void | null;
	record: FormResponse;
	setRecord: ( response: FormResponse ) => void;
}

const useResponseNavigation = ( {
	onChangeSelection,
	record,
	setRecord,
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
				setRecord( nextItem );
				onChangeSelection?.( [ getItemId( nextItem ) ] );
			}
		}
	}, [ hasNext, records, currentIndex, setRecord, onChangeSelection ] );

	const handlePrevious = useCallback( () => {
		if ( hasPrevious && records && currentIndex >= 0 ) {
			const prevItem = records[ currentIndex - 1 ];
			if ( prevItem ) {
				setRecord( prevItem );
				onChangeSelection?.( [ getItemId( prevItem ) ] );
			}
		}
	}, [ hasPrevious, records, currentIndex, setRecord, onChangeSelection ] );

	return {
		currentIndex,
		hasNext,
		hasPrevious,
		handleNext,
		handlePrevious,
	};
};

export default useResponseNavigation;
