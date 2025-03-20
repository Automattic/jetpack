import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, arrowRight } from '@wordpress/icons';
import clsx from 'clsx';
import React, { Children, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Swipeable } from '../swipeable';

import './style.scss';

type ControlsProps = {
	showControlLabels?: boolean;
	currentPage: number;
	numberOfPages: number;
	setCurrentPage: ( page: number ) => void;
	navArrowSize: number;
	tracksPrefix: string;
	tracksFn: ( eventName: string, data?: Record< string, unknown > ) => void;
};

const Controls = ( {
	showControlLabels = false,
	currentPage,
	numberOfPages,
	setCurrentPage,
	navArrowSize,
	tracksPrefix,
	tracksFn,
}: ControlsProps ) => {
	const isRtl = false;

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

	const handlePrevClick = useCallback( () => {
		const destinationPage = currentPage - 1;
		tracksFn( tracksPrefix + '_prev_arrow_click', {
			current_page: currentPage,
			destination_page: destinationPage,
		} );
		setCurrentPage( destinationPage );
	}, [ currentPage, setCurrentPage, tracksFn, tracksPrefix ] );

	const handleNextClick = useCallback( () => {
		const destinationPage = currentPage + 1;
		tracksFn( tracksPrefix + '_next_arrow_click', {
			current_page: currentPage,
			destination_page: destinationPage,
		} );
		setCurrentPage( destinationPage );
	}, [ currentPage, setCurrentPage, tracksFn, tracksPrefix ] );

	if ( numberOfPages < 2 ) {
		return null;
	}

	const canGoBack = currentPage > 0;
	const canGoForward = currentPage < numberOfPages - 1;

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
			<li key="dot-pager-prev" className="dot-pager__control-gap">
				<Button
					className="dot-pager__control-prev"
					disabled={ ! canGoBack }
					aria-label={ __( 'Previous', 'jetpack-components' ) }
					onClick={ handlePrevClick }
				>
					<Icon
						icon={ arrowRight }
						size={ navArrowSize }
						fill="currentColor"
						style={ ! isRtl ? { transform: 'scaleX(-1)' } : undefined }
					/>
					{ showControlLabels && __( 'Previous', 'jetpack-components' ) }
				</Button>
			</li>
			<li key="dot-pager-next">
				<Button
					className="dot-pager__control-next"
					disabled={ ! canGoForward }
					aria-label={ __( 'Next', 'jetpack-components' ) }
					onClick={ handleNextClick }
				>
					{ showControlLabels && __( 'Next', 'jetpack-components' ) }
					<Icon
						icon={ arrowRight }
						size={ navArrowSize }
						fill="currentColor"
						style={ isRtl ? { transform: 'scaleX(-1)' } : undefined }
					/>
				</Button>
			</li>
		</ul>
	);
};

type DotPagerProps = {
	showControlLabels?: boolean;
	hasDynamicHeight?: boolean;
	children: ReactNode;
	className?: string;
	onPageSelected?: ( index: number ) => void;
	isClickEnabled?: boolean;
	rotateTime?: number;
	navArrowSize?: number;
	tracksPrefix?: string;
	tracksFn?: ( eventName: string, data?: Record< string, unknown > ) => void;
	includePreviousButton?: boolean;
	includeNextButton?: boolean;
	includeFinishButton?: boolean;
	onFinish?: () => void;
};

const DotPager = ( {
	showControlLabels = false,
	hasDynamicHeight = false,
	children,
	className = '',
	onPageSelected,
	isClickEnabled = false,
	rotateTime = 0,
	navArrowSize = 18,
	tracksPrefix = '',
	tracksFn = () => {},
	includePreviousButton = false,
	includeNextButton = false,
	includeFinishButton = false,
	onFinish = () => {},
	...props
}: DotPagerProps ) => {
	// Filter out the empty children
	const normalizedChildren = Children.toArray( children ).filter( Boolean );

	const [ currentPage, setCurrentPage ] = useState( 0 );

	const numPages = Children.count( normalizedChildren );

	useEffect( () => {
		if ( currentPage >= numPages ) {
			setCurrentPage( numPages - 1 );
		}
	}, [ numPages, currentPage ] );

	useEffect( () => {
		if ( rotateTime > 0 && numPages > 1 ) {
			const timerId = setTimeout( () => {
				setCurrentPage( ( currentPage + 1 ) % numPages );
			}, rotateTime );

			return () => clearTimeout( timerId );
		}
	}, [ currentPage, numPages, rotateTime ] );

	const handlePrevButtonClick = useCallback( () => {
		const destinationPage = currentPage - 1;
		tracksFn( tracksPrefix + '_prev_button_click', {
			current_page: currentPage,
			destination_page: destinationPage,
		} );
		setCurrentPage( destinationPage );
	}, [ currentPage, tracksFn, tracksPrefix ] );

	const handleNextButtonClick = useCallback( () => {
		const destinationPage = currentPage + 1;
		tracksFn( tracksPrefix + '_next_button_click', {
			current_page: currentPage,
			destination_page: destinationPage,
		} );
		setCurrentPage( destinationPage );
	}, [ currentPage, tracksFn, tracksPrefix ] );

	const handleFinishClick = useCallback( () => {
		tracksFn( tracksPrefix + '_finish_button_click' );
		onFinish();
	}, [ tracksFn, tracksPrefix, onFinish ] );

	const handleSelectPage = useCallback(
		( index: number ) => {
			setCurrentPage( index );
			onPageSelected?.( index );
		},
		[ onPageSelected ]
	);

	return (
		<div className={ clsx( 'dot-pager', className ) } { ...props }>
			<Controls
				showControlLabels={ showControlLabels }
				currentPage={ currentPage }
				numberOfPages={ numPages }
				setCurrentPage={ handleSelectPage }
				navArrowSize={ navArrowSize }
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
			{ includePreviousButton && currentPage !== 0 && (
				<Button
					className="dot-pager__button dot-pager__button_previous"
					onClick={ handlePrevButtonClick }
				>
					{ __( 'Previous', 'jetpack-components' ) }
				</Button>
			) }
			{ includeNextButton && currentPage < numPages - 1 && (
				<Button
					className="dot-pager__button dot-pager__button_next is-primary"
					onClick={ handleNextButtonClick }
				>
					{ __( 'Next', 'jetpack-components' ) }
				</Button>
			) }
			{ includeFinishButton && currentPage === numPages - 1 && (
				<Button
					className="dot-pager__button dot-pager__button_finish is-primary"
					onClick={ handleFinishClick }
				>
					{ __( 'Done', 'jetpack-components' ) }
				</Button>
			) }
		</div>
	);
};

export default DotPager;
