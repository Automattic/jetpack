import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import React, { useCallback, useMemo, useState, memo } from 'react';
import styles from './styles.module.scss';

const PaginationButton = memo( ( { pageNumber, currentPage, onPageChange } ) => {
	const handleClick = useCallback( () => {
		onPageChange( pageNumber );
	}, [ onPageChange, pageNumber ] );

	return (
		<Button
			onClick={ handleClick }
			variant={ currentPage === pageNumber ? 'primary' : 'secondary' }
			aria-current={ currentPage === pageNumber ? 'page' : undefined }
		>
			{ pageNumber }
		</Button>
	);
} );

const Pagination = ( { list, itemPerPage = 10, children } ) => {
	const [ currentPage, setCurrentPage ] = useState( 1 );

	const totalPages = useMemo( () => Math.ceil( list.length / itemPerPage ), [ list, itemPerPage ] );

	const currentItems = useMemo( () => {
		const indexOfLastItem = currentPage * itemPerPage;
		const indexOfFirstItem = indexOfLastItem - itemPerPage;
		return list.slice( indexOfFirstItem, indexOfLastItem );
	}, [ currentPage, list, itemPerPage ] );

	const onPageChange = useCallback( pageNumber => {
		setCurrentPage( pageNumber );
	}, [] );

	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const handleFirstPageClick = useCallback( () => {
		onPageChange( 1 );
	}, [ onPageChange ] );

	const handlePreviousPageClick = useCallback( () => {
		onPageChange( currentPage - 1 );
	}, [ currentPage, onPageChange ] );

	const handleNextPageClick = useCallback( () => {
		onPageChange( currentPage + 1 );
	}, [ currentPage, onPageChange ] );

	const handleLastPageClick = useCallback( () => {
		onPageChange( totalPages );
	}, [ onPageChange, totalPages ] );

	const getPageNumbers = useCallback( () => {
		const pageNumbers = [];

		if ( ! isSmall ) {
			pageNumbers.push( 1 );
		}

		const start = isSmall ? 1 : 2;
		const offset = isSmall ? 0 : 2;
		const end = isSmall ? 0 : 1;
		const startPage = Math.max( start, currentPage - offset );
		const endPage = Math.min( totalPages - end, currentPage + offset );

		if ( startPage > 2 && ! isSmall ) {
			pageNumbers.push( '...' );
		}

		for ( let i = startPage; i <= endPage; i++ ) {
			pageNumbers.push( i );
		}

		if ( endPage < totalPages - 1 && ! isSmall ) {
			pageNumbers.push( '...' );
		}

		if ( totalPages > 1 && ! isSmall ) {
			pageNumbers.push( totalPages );
		}

		return pageNumbers;
	}, [ currentPage, totalPages, isSmall ] );

	return (
		<>
			{ children( { currentItems } ) }
			{ totalPages > 1 && (
				<div className={ styles[ 'pagination-container' ] }>
					{ isSmall && (
						<Button
							onClick={ handleFirstPageClick }
							disabled={ currentPage === 1 }
							variant={ 'secondary' }
						>
							{ 1 }
						</Button>
					) }
					<Button
						onClick={ handlePreviousPageClick }
						disabled={ currentPage === 1 }
						variant={ 'secondary' }
					>
						{ '<' }
					</Button>
					{ getPageNumbers().map( ( pageNumber, index ) =>
						typeof pageNumber === 'number' ? (
							<PaginationButton
								key={ index }
								pageNumber={ pageNumber }
								currentPage={ currentPage }
								onPageChange={ onPageChange }
							/>
						) : (
							<span key={ index } className={ styles.ellipsis }>
								{ pageNumber }
							</span>
						)
					) }
					<Button
						onClick={ handleNextPageClick }
						disabled={ currentPage === totalPages }
						variant={ 'secondary' }
					>
						{ '>' }
					</Button>
					{ isSmall && (
						<Button
							onClick={ handleLastPageClick }
							disabled={ currentPage === totalPages }
							variant={ 'secondary' }
						>
							{ totalPages }
						</Button>
					) }
				</div>
			) }
		</>
	);
};

export default Pagination;
