/**
 * External dependencies
 */
import { Button, Text } from '@automattic/jetpack-components';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { PaginationProps } from './types';
import type React from 'react';

const range = ( start, count ) => {
	return [ ...Array( count ) ].map( ( _, index ) => index + start );
};

const Ellipsis = () => (
	<Button size="small" className={ classnames( styles.button ) } variant="tertiary" disabled>
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
				onClick={ () => onChangePage( page ) }
			>
				{ page }
			</Button>
		);
	};

	let content;

	if ( numPages <= 7 ) {
		content = range( 1, numPages ).map( i => <PageButton page={ i } key={ i } /> );
	} else if ( currentPage < 5 ) {
		content = (
			<>
				{ range( 1, 5 ).map( i => (
					<PageButton page={ i } key={ i } />
				) ) }
				<Ellipsis />
				<PageButton page={ numPages } />
			</>
		);
	} else if ( currentPage > numPages - 4 ) {
		content = (
			<>
				<PageButton page={ 1 } />
				<Ellipsis />
				{ range( numPages - 4, 5 ).map( i => (
					<PageButton page={ i } key={ i } />
				) ) }
			</>
		);
	} else {
		content = (
			<>
				<PageButton page={ 1 } />
				<Ellipsis />
				{ range( currentPage - 1, 3 ).map( i => (
					<PageButton page={ i } key={ i } />
				) ) }
				<Ellipsis />
				<PageButton page={ numPages } />
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
				onClick={ () => onChangePage( Math.min( numPages, currentPage + 1 ) ) }
			>
				<Icon icon={ chevronRight } />
			</Button>
		</div>
	);
};

export default Pagination;
