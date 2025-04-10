import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { Children, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Swipeable } from '../swipeable/index.tsx';

import './style.scss';

type ControlsProps = {
	currentPage: number;
	numberOfPages: number;
	setCurrentPage: ( page: number ) => void;
	tracksPrefix: string;
	tracksFn: ( eventName: string, data?: Record< string, unknown > ) => void;
};

const Controls = ( {
	currentPage,
	numberOfPages,
	setCurrentPage,
	tracksPrefix,
	tracksFn,
}: ControlsProps ) => {
	// Create a map of memoized handlers for each page
	const pageHandlers = useMemo(
		() =>
			Array.from( { length: numberOfPages }, ( _, page ) => () => {
				tracksFn( tracksPrefix + '_dot_click', {
					current_page: currentPage,
					destination_page: page,
				} );
				setCurrentPage( page );
			} ),
		[ numberOfPages, currentPage, tracksFn, tracksPrefix, setCurrentPage ]
	);

	if ( numberOfPages < 2 ) {
		return null;
	}

	return (
		<ul className="dot-pager__controls" aria-label={ __( 'Pager controls', 'jetpack-components' ) }>
			{ Array.from( { length: numberOfPages }, ( _, page ) => (
				<li key={ `page-${ page }` } aria-current={ page === currentPage ? 'page' : undefined }>
					<Button
						key={ page.toString() }
						className={ clsx( 'dot-pager__control-choose-page', {
							'dot-pager__control-current': page === currentPage,
						} ) }
						disabled={ page === currentPage }
						aria-label={ sprintf(
							/* translators: %1$d: current page number, %2$d: total number of pages */
							__( 'Page %1$d of %2$d', 'jetpack-components' ),
							page + 1,
							numberOfPages
						) }
						onClick={ pageHandlers[ page ] }
					/>
				</li>
			) ) }
		</ul>
	);
};

type DotPagerProps = {
	hasDynamicHeight?: boolean;
	children: ReactNode;
	className?: string;
	onPageSelected?: ( index: number ) => void;
	isClickEnabled?: boolean;
	rotateTime?: number;
	tracksPrefix?: string;
	tracksFn?: ( eventName: string, data?: Record< string, unknown > ) => void;
};

const DotPager = ( {
	hasDynamicHeight = false,
	children,
	className = '',
	onPageSelected,
	isClickEnabled = false,
	rotateTime = 0,
	tracksPrefix = '',
	tracksFn = () => {},
	...props
}: DotPagerProps ) => {
	const normalizedChildren = Children.toArray( children ).filter( Boolean );
	const [ currentPage, setCurrentPage ] = useState( 0 );
	const [ isPaused, setIsPaused ] = useState( false );
	const numPages = Children.count( normalizedChildren );

	useEffect( () => {
		if ( rotateTime > 0 && numPages > 1 && ! isPaused ) {
			const timerId = setTimeout( () => {
				// Add 1 to numPages to account for the clones
				setCurrentPage( ( currentPage + 1 ) % ( numPages + 1 ) );
			}, rotateTime * 1000 );

			return () => clearTimeout( timerId );
		}
	}, [ currentPage, numPages, rotateTime, isPaused ] );

	const handleSelectPage = useCallback(
		( index: number ) => {
			setCurrentPage( index );
			onPageSelected?.( index );
		},
		[ onPageSelected ]
	);

	const handleMouseEnter = useCallback( () => {
		setIsPaused( true );
	}, [] );

	const handleMouseLeave = useCallback( () => {
		setIsPaused( false );
	}, [] );

	return (
		<div
			className={ clsx( 'dot-pager', className ) }
			onMouseEnter={ handleMouseEnter }
			onMouseLeave={ handleMouseLeave }
			{ ...props }
		>
			<Controls
				currentPage={ currentPage }
				numberOfPages={ numPages }
				setCurrentPage={ handleSelectPage }
				tracksPrefix={ tracksPrefix }
				tracksFn={ tracksFn }
			/>
			<Swipeable
				hasDynamicHeight={ hasDynamicHeight }
				onPageSelect={ handleSelectPage }
				currentPage={ currentPage }
				pageClassName="dot-pager__page"
				containerClassName="dot-pager__pages"
				isClickEnabled={ isClickEnabled }
			>
				{ normalizedChildren }
			</Swipeable>
		</div>
	);
};

export default DotPager;
