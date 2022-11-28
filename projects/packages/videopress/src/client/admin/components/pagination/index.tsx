/**
 * External dependencies
 */
import { Button, Text } from '@automattic/jetpack-components';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import useVideos, { useLocalVideos } from '../../hooks/use-videos';
import styles from './style.module.scss';
import { PaginationProps } from './types';
import type React from 'react';

const range = ( start, count ) => {
	return [ ...Array( count ) ].map( ( _, index ) => index + start );
};

const Ellipsis = () => (
	<Button
		size="small"
		className={ classnames( styles.button ) }
		variant="tertiary"
		disabled
		aria-disabled
	>
		<Text>...</Text>
	</Button>
);

/**
 * Pagination component
 *
 * @param {PaginationProps} props - Component props.
 * @returns {React.ReactNode} - Pagination react component.
 */
const Pagination: React.FC< PaginationProps > = ( {
	className,
	currentPage = 1,
	perPage,
	total,
	minColumns = 7,
	disabled,
	onChangePage,
} ) => {
	if ( ! total || ! perPage ) {
		return null;
	}

	const numPages = Math.ceil( total / perPage );
	if ( currentPage > numPages ) {
		onChangePage( numPages );
		return null;
	}
	if ( currentPage < 1 ) {
		onChangePage( 1 );
		return null;
	}

	const PageButton = ( { page }: { page: number } ) => {
		const isCurrent = page === currentPage;

		return (
			<Button
				size="small"
				className={ classnames( styles.button, isCurrent ? styles.selected : null ) }
				variant={ isCurrent ? 'primary' : 'tertiary' }
				disabled={ disabled }
				aria-disabled={ disabled }
				onClick={ () => onChangePage( page ) }
			>
				{ page }
			</Button>
		);
	};

	// Smallest odd integer from minColumns, inclusive, with a minimum of 7 columns
	let numColumns = Math.max( minColumns, 7 );
	numColumns = numColumns % 2 === 0 ? numColumns + 1 : numColumns;

	let content;

	if ( numPages <= numColumns ) {
		content = range( 1, numPages ).map( i => <PageButton page={ i } key={ i } /> );
	} else if ( currentPage < numColumns - 2 ) {
		content = (
			<>
				{ range( 1, numColumns - 2 ).map( i => (
					<PageButton page={ i } key={ i } />
				) ) }
				<Ellipsis />
				<PageButton page={ numPages } />
			</>
		);
	} else if ( currentPage > numPages - numColumns + 3 ) {
		content = (
			<>
				<PageButton page={ 1 } />
				<Ellipsis />
				{ range( numPages - numColumns + 3, numColumns - 2 ).map( i => (
					<PageButton page={ i } key={ i } />
				) ) }
			</>
		);
	} else {
		const numSideColumns = ( numColumns - 5 ) / 2;

		content = (
			<>
				{ range( 1, numSideColumns ).map( i => (
					<PageButton page={ i } key={ i } />
				) ) }
				<Ellipsis />
				{ range( currentPage - 1, 3 ).map( i => (
					<PageButton page={ i } key={ i } />
				) ) }
				<Ellipsis />
				{ range( numPages - numSideColumns + 1, numSideColumns ).map( i => (
					<PageButton page={ i } key={ i } />
				) ) }
			</>
		);
	}

	return (
		<div className={ classnames( className, styles.wrapper ) }>
			<Button
				size="small"
				className={ classnames( styles.navigation, styles.button ) }
				variant="tertiary"
				disabled={ disabled || currentPage === 1 }
				aria-disabled={ disabled || currentPage === 1 }
				onClick={ () => onChangePage( Math.max( 1, currentPage - 1 ) ) }
			>
				<Icon icon={ chevronLeft } />
			</Button>
			{ content }
			<Button
				size="small"
				className={ classnames( styles.navigation, styles.button ) }
				variant="tertiary"
				disabled={ disabled || currentPage === numPages }
				aria-disabled={ disabled || currentPage === numPages }
				onClick={ () => onChangePage( Math.min( numPages, currentPage + 1 ) ) }
			>
				<Icon icon={ chevronRight } />
			</Button>
		</div>
	);
};

export const ConnectPagination = ( props: { className: string; disabled?: boolean } ) => {
	const { setPage, page, itemsPerPage, total, isFetching } = useVideos();
	return total <= itemsPerPage ? (
		<div className={ classnames( props.className, styles[ 'pagination-placeholder' ] ) } />
	) : (
		<Pagination
			{ ...props }
			perPage={ itemsPerPage }
			onChangePage={ setPage }
			currentPage={ page }
			total={ total }
			disabled={ isFetching || props.disabled }
		/>
	);
};

export const ConnectLocalPagination = ( props: { className?: string; disabled?: boolean } ) => {
	const { setPage, page, itemsPerPage, total, isFetching } = useLocalVideos();

	return total < itemsPerPage ? (
		<div className={ classnames( props.className, styles[ 'pagination-placeholder' ] ) } />
	) : (
		<Pagination
			{ ...props }
			perPage={ itemsPerPage }
			onChangePage={ setPage }
			currentPage={ page }
			total={ total }
			disabled={ isFetching || props.disabled }
		/>
	);
};

export default Pagination;
