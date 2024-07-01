import clsx from 'clsx';
import { useState, useEffect, useMemo } from 'react';
import ChevronLeft from '$svg/chevron-left';
import ChevronRight from '$svg/chevron-right';
import { Link } from 'react-router-dom';
import styles from './pagination.module.scss';

interface PaginationProps {
	group: string;
	current: number;
	total: number;
}

interface PaginationLinkProps {
	group: string;
	direction: 'left' | 'right';
	current: number;
	total: number;
	children: React.ReactNode;
}

const PaginationArrow: React.FC< PaginationLinkProps > = ( {
	group,
	direction,
	current,
	total,
	children,
} ) => {
	const inactive = useMemo(
		() => ( direction === 'left' ? current === 1 : current === total ),
		[ direction, current, total ]
	);

	const page = useMemo(
		() => ( direction === 'left' ? current - 1 : current + 1 ),
		[ direction, current ]
	);

	if ( inactive ) {
		return <span className={ clsx( styles.page, styles.inactive ) }>{ children }</span>;
	}

	return (
		<Link to={ `/image-size-analysis/${ group }/${ page }` } className={ styles.page }>
			{ children }
		</Link>
	);
};

const Pagination: React.FC< PaginationProps > = ( { group, current, total } ) => {
	const MORE_ICON = -1;
	const [ pages, setPages ] = useState< number[] >( [] );

	const slidingWindow = ( currentPage: number, maxPage: number, windowSize = 8 ): number[] => {
		const first = Math.max(
			1,
			Math.min( maxPage - windowSize, currentPage - Math.floor( windowSize / 2 ) )
		);
		const last = Math.min( maxPage, first + windowSize );
		return new Array( last - first + 1 ).fill( 0 ).map( ( _, i ) => first + i );
	};

	useEffect( () => {
		const generatePagination = ( currentPage: number, maxPage: number ) => {
			const padding = 2;
			const pagination = slidingWindow( currentPage, maxPage );

			if ( pagination[ 0 ] - padding >= 0 ) {
				pagination.splice( 0, padding, 1, MORE_ICON );
			}

			if ( pagination[ pagination.length - padding ] <= maxPage - padding ) {
				pagination.splice( pagination.length - padding, padding, MORE_ICON, maxPage );
			}

			return pagination;
		};
		setPages( generatePagination( current, total ) );
	}, [ MORE_ICON, current, total ] );

	return (
		<div className={ styles.pagination }>
			{ total > 1 && (
				<>
					<PaginationArrow direction="left" group={ group } current={ current } total={ total }>
						<ChevronLeft />
					</PaginationArrow>

					<ul className={ styles.list }>
						{ pages.map( ( paginationPage, index ) => (
							<li key={ index } className={ styles.item }>
								{ paginationPage === MORE_ICON ? (
									<span className={ styles.page }> ... </span>
								) : (
									<Link
										to={ `/image-size-analysis/${ group }/${ paginationPage }` }
										className={ clsx( styles.page, {
											[ styles.current ]: paginationPage === current,
										} ) }
									>
										{ paginationPage }
									</Link>
								) }
							</li>
						) ) }
					</ul>

					<PaginationArrow direction="right" group={ group } current={ current } total={ total }>
						<ChevronRight />
					</PaginationArrow>
				</>
			) }
		</div>
	);
};

export default Pagination;
