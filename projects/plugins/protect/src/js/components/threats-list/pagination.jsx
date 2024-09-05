import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import React, { useCallback, useState, useMemo } from 'react';
import styles from './styles.module.scss';

const PaginationButton = ( { pageNumber, currentPage, onPageChange } ) => {
	const isCurrentPage = useMemo( () => currentPage === pageNumber, [ currentPage, pageNumber ] );

	const handleClick = useCallback( () => {
		onPageChange( pageNumber );
	}, [ onPageChange, pageNumber ] );

	return (
		<Button
			size={ 'medium' }
			className={ ! isCurrentPage ? styles.unfocused : null }
			onClick={ handleClick }
			aria-current={ isCurrentPage ? 'page' : undefined }
			aria-label={ sprintf(
				/* translators: placeholder is a page number, i.e. "Page 123" */
				__( 'Page %d', 'jetpack-protect' ),
				pageNumber
			) }
		>
			{ pageNumber }
		</Button>
	);
};

const Pagination = ( { list, itemPerPage = 10, children } ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const [ currentPage, setCurrentPage ] = useState( 1 );

	const handlePreviousPageClick = useCallback(
		() => setCurrentPage( currentPage - 1 ),
		[ currentPage, setCurrentPage ]
	);
	const handleNextPageClick = useCallback(
		() => setCurrentPage( currentPage + 1 ),
		[ currentPage, setCurrentPage ]
	);

	const totalPages = useMemo( () => Math.ceil( list.length / itemPerPage ), [ list, itemPerPage ] );

	const currentItems = useMemo( () => {
		const indexOfLastItem = currentPage * itemPerPage;
		const indexOfFirstItem = indexOfLastItem - itemPerPage;
		return list.slice( indexOfFirstItem, indexOfLastItem );
	}, [ currentPage, list, itemPerPage ] );

	const pageNumbers = useMemo( () => {
		if ( isSm ) {
			return [ currentPage ];
		}

		const result = [ 1 ];
		if ( currentPage > 3 && totalPages > 4 ) {
			result.push( '…' );
		}

		if ( currentPage === 1 ) {
			// Current page is the first page.
			// i.e. [ 1 ] 2 3 4 ... 10
			result.push( currentPage + 1, currentPage + 2, currentPage + 3 );
		} else if ( currentPage === 2 ) {
			// Current page is the second to first page.
			// i.e. 1 [ 2 ] 3 4 ... 10
			result.push( currentPage, currentPage + 1, currentPage + 2 );
		} else if ( currentPage < totalPages - 1 ) {
			// Current page is positioned in the middle of the pagination.
			// i.e. 1 ... 3 [ 4 ] 5 ... 10
			result.push( currentPage - 1, currentPage, currentPage + 1 );
		} else if ( currentPage === totalPages - 1 ) {
			// Current page is the second to last page.
			// i.e. 1 ... 7 8 [ 9 ] 10
			currentPage > 3 && result.push( currentPage - 2 );
			currentPage > 2 && result.push( currentPage - 1 );
			result.push( currentPage );
		} else if ( currentPage === totalPages ) {
			// Current page is the last page.
			// i.e. 1 ... 7 8 9 [ 10 ]
			currentPage >= 5 && result.push( currentPage - 3 );
			currentPage >= 4 && result.push( currentPage - 2 );
			result.push( currentPage - 1 );
		}

		if ( result[ result.length - 1 ] < totalPages - 1 ) {
			result.push( '…' );
			result.push( totalPages );
		} else if ( result[ result.length - 1 ] < totalPages ) {
			result.push( totalPages );
		}

		return result.filter( pageNumber => pageNumber <= totalPages || isNaN( pageNumber ) );
	}, [ currentPage, isSm, totalPages ] );

	return (
		<>
			{ children( { currentItems } ) }
			{ totalPages > 1 && (
				<nav
					role="navigation"
					aria-label={ __( 'Threat list pages', 'jetpack-protect' ) }
					className={ styles[ 'pagination-container' ] }
				>
					<Button
						onClick={ handlePreviousPageClick }
						disabled={ currentPage === 1 }
						variant={ 'link' }
						icon={ chevronLeft }
						iconSize={ 24 }
						aria-label={ __( 'Previous page', 'jetpack-protect' ) }
					/>
					{ pageNumbers.map( ( pageNumber, index ) =>
						typeof pageNumber === 'number' ? (
							<PaginationButton
								key={ pageNumber }
								pageNumber={ pageNumber }
								currentPage={ currentPage }
								onPageChange={ setCurrentPage }
							/>
						) : (
							<span key={ `ellipses_${ index }` }>{ pageNumber }</span>
						)
					) }
					<Button
						onClick={ handleNextPageClick }
						disabled={ currentPage === totalPages }
						variant={ 'link' }
						icon={ chevronRight }
						iconSize={ 24 }
						aria-label={ __( 'Next page', 'jetpack-protect' ) }
					/>
				</nav>
			) }
		</>
	);
};

export default Pagination;
