import { useState, useCallback, useMemo } from 'react';
import { ITEMS_PER_PAGE } from '../../constants';

const usePagination = list => {
	const [ currentPage, setCurrentPage ] = useState( 1 );

	const totalPages = useMemo( () => Math.ceil( list.length / ITEMS_PER_PAGE ), [ list ] );

	const currentItems = useMemo( () => {
		const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
		const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
		return list.slice( indexOfFirstItem, indexOfLastItem );
	}, [ currentPage, list ] );

	const handlePageChange = useCallback( pageNumber => {
		setCurrentPage( pageNumber );
	}, [] );

	return {
		currentPage,
		totalPages,
		currentItems,
		handlePageChange,
	};
};

export default usePagination;
