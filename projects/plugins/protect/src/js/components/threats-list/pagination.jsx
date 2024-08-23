import { Button } from '@automattic/jetpack-components';
import React, { useCallback, memo } from 'react';
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

const Pagination = ( { currentPage, totalPages, onPageChange } ) => {
	const handlePreviousPageClick = useCallback( () => {
		onPageChange( currentPage - 1 );
	}, [ currentPage, onPageChange ] );

	const handleNextPageClick = useCallback( () => {
		onPageChange( currentPage + 1 );
	}, [ currentPage, onPageChange ] );

	const getPageNumbers = useCallback( () => {
		const pageNumbers = [];

		pageNumbers.push( 1 );

		const startPage = Math.max( 2, currentPage - 2 );
		const endPage = Math.min( totalPages - 1, currentPage + 2 );

		if ( startPage > 2 ) {
			pageNumbers.push( '...' );
		}

		for ( let i = startPage; i <= endPage; i++ ) {
			pageNumbers.push( i );
		}

		if ( endPage < totalPages - 1 ) {
			pageNumbers.push( '...' );
		}

		if ( totalPages > 1 ) {
			pageNumbers.push( totalPages );
		}

		return pageNumbers;
	}, [ currentPage, totalPages ] );

	if ( totalPages > 1 ) {
		return (
			<div className={ styles[ 'pagination-container' ] }>
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
			</div>
		);
	}
};

export default Pagination;
