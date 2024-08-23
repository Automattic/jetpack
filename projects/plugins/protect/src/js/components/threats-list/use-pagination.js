import { useState, useCallback, useMemo } from 'react';

const usePagination = list => {
	const itemsPerPage = 5;
	const [ currentPage, setCurrentPage ] = useState( 1 );

	const totalPages = useMemo(
		() => Math.ceil( list.length / itemsPerPage ),
		[ list, itemsPerPage ]
	);

	const currentItems = useMemo( () => {
		const indexOfLastItem = currentPage * itemsPerPage;
		const indexOfFirstItem = indexOfLastItem - itemsPerPage;
		return list.slice( indexOfFirstItem, indexOfLastItem );
	}, [ currentPage, itemsPerPage, list ] );

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
