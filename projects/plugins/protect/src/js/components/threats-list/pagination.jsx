import { Button } from '@automattic/jetpack-components';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import React, { useCallback, useEffect, useState, useMemo, memo } from 'react';
import styles from './styles.module.scss';

const PaginationButton = memo( ( { pageNumber, currentPage, onPageChange } ) => {
	const isCurrentPage = useMemo( () => currentPage === pageNumber, [ currentPage, pageNumber ] );

	const handleClick = useCallback( () => {
		onPageChange( pageNumber );
	}, [ onPageChange, pageNumber ] );

	return (
		<Button
			className={ isCurrentPage ? null : styles[ 'page-button' ] }
			onClick={ handleClick }
			aria-current={ isCurrentPage ? 'page' : undefined }
		>
			{ pageNumber }
		</Button>
	);
} );

const IconButton = ( { onClick, disabled, direction } ) => {
	const iconSize = 32;
	const isLeft = direction === 'left';
	return (
		<Button
			className={ styles[ 'icon-button' ] }
			onClick={ onClick }
			disabled={ disabled }
			variant={ 'link' }
		>
			<div className={ isLeft ? styles[ 'first-icon' ] : styles[ 'last-icon' ] }>
				<Icon
					className={ `${ styles.icon } ${ styles.outside }` }
					icon={ isLeft ? chevronLeft : chevronRight }
					size={ iconSize }
				/>
				<Icon
					className={ `${ styles.icon } ${ styles.inside }` }
					icon={ isLeft ? chevronLeft : chevronRight }
					size={ iconSize }
				/>
			</div>
		</Button>
	);
};

const Pagination = ( { list, itemPerPage = 10, children } ) => {
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const [ isSmall, setIsSmall ] = useState( window.matchMedia( '(max-width: 1220px)' ).matches );

	const totalPages = useMemo( () => Math.ceil( list.length / itemPerPage ), [ list, itemPerPage ] );

	const currentItems = useMemo( () => {
		const indexOfLastItem = currentPage * itemPerPage;
		const indexOfFirstItem = indexOfLastItem - itemPerPage;
		return list.slice( indexOfFirstItem, indexOfLastItem );
	}, [ currentPage, list, itemPerPage ] );

	const onPageChange = useCallback( pageNumber => {
		setCurrentPage( pageNumber );
	}, [] );

	useEffect( () => {
		const mediaQuery = window.matchMedia( '(max-width: 1220px)' );
		const handleMediaChange = event => {
			setIsSmall( event.matches );
		};
		mediaQuery.addEventListener( 'change', handleMediaChange );
		return () => {
			mediaQuery.removeEventListener( 'change', handleMediaChange );
		};
	}, [] );

	const handleFirstPageClick = useCallback( () => onPageChange( 1 ), [ onPageChange ] );
	const handlePreviousPageClick = useCallback(
		() => onPageChange( currentPage - 1 ),
		[ currentPage, onPageChange ]
	);
	const handleNextPageClick = useCallback(
		() => onPageChange( currentPage + 1 ),
		[ currentPage, onPageChange ]
	);
	const handleLastPageClick = useCallback(
		() => onPageChange( totalPages ),
		[ onPageChange, totalPages ]
	);

	const getPageNumbers = useCallback( () => {
		if ( isSmall ) {
			return [ currentPage ];
		}

		if ( currentPage === 1 ) {
			return [ 1, 2, 3 ].filter( page => page <= totalPages );
		}
		if ( currentPage === totalPages ) {
			return [ totalPages - 2, totalPages - 1, totalPages ].filter( page => page >= 1 );
		}
		return [ currentPage - 1, currentPage, currentPage + 1 ];
	}, [ currentPage, totalPages, isSmall ] );

	return (
		<>
			{ children( { currentItems } ) }
			{ totalPages > 1 && (
				<div className={ styles[ 'pagination-container' ] }>
					<IconButton
						onClick={ handleFirstPageClick }
						disabled={ currentPage === 1 }
						direction="left"
					/>
					<Button
						className={ styles[ 'icon-button' ] }
						onClick={ handlePreviousPageClick }
						disabled={ currentPage === 1 }
						variant={ 'link' }
						icon={ chevronLeft }
						iconSize={ 32 }
					></Button>
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
						className={ styles[ 'icon-button' ] }
						onClick={ handleNextPageClick }
						disabled={ currentPage === totalPages }
						variant={ 'link' }
						icon={ chevronRight }
						iconSize={ 32 }
					></Button>
					<IconButton
						onClick={ handleLastPageClick }
						disabled={ currentPage === totalPages }
						direction="right"
					/>
				</div>
			) }
		</>
	);
};

export default Pagination;
