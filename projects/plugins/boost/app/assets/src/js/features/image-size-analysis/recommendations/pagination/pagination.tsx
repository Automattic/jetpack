import { useState, useEffect } from 'react';
import PaginationArrow from '../ui/pagination-arrow/pagination-arrow';
import ChevronLeft from '$svg/chevron-left';
import ChevronRight from '$svg/chevron-right';
import { navigate } from '$lib/utils/navigate';

interface PaginationProps {
	group: string;
	current: number;
	total: number;
	setCurrentPage: ( page: number ) => void;
}

const Pagination: React.FC< PaginationProps > = ( { group, current, total, setCurrentPage } ) => {
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
		<div className="jb-pagination">
			{ total > 1 && (
				<>
					<PaginationArrow direction="left" group={ group } current={ current } total={ total }>
						<ChevronLeft />
					</PaginationArrow>

					<ul className="jb-pagination__list">
						{ pages.map( ( page, index ) => (
							<li key={ index } className="jb-pagination__item">
								{ page === MORE_ICON ? (
									<span className="jb-pagination__page jb-pagination__more"> ... </span>
								) : (
									// eslint-disable-next-line jsx-a11y/anchor-is-valid
									<a
										href={ `#/image-size-analysis/${ group }/${ page }` }
										onClick={ e => {
											e.preventDefault();
											setCurrentPage( page );
											navigate( `/image-size-analysis/${ group }/${ page }` );
										} }
										className={ `jb-pagination__page${
											page === current ? ' jb-pagination__page--current' : ''
										}` }
									>
										{ page }
									</a>
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
