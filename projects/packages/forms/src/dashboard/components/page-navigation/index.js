import { Gridicon } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { filter, flatten, map, range } from 'lodash';
import PageNumber from './page-number';

import './style.scss';

const PageNavigation = ( { currentPage, expandedRange = 3, onSelectPage, pages } ) => {
	const goToPrevious = useCallback(
		() => onSelectPage( currentPage - 1 ),
		[ currentPage, onSelectPage ]
	);
	const goToNext = useCallback(
		() => onSelectPage( currentPage + 1 ),
		[ currentPage, onSelectPage ]
	);

	const currentRange = range(
		Math.max( 0, currentPage - expandedRange + 1 ),
		Math.min( pages, currentPage + expandedRange - 1 ) + 1
	);
	const totalRange = filter(
		flatten( [
			expandedRange < currentPage && 1,
			expandedRange + 1 < currentPage && ( currentPage === expandedRange + 2 ? 2 : Infinity ),
			currentRange,
			currentPage < pages - expandedRange &&
				( currentPage === pages - expandedRange ? pages - 1 : Infinity ),
			currentPage < pages - expandedRange + 1 && pages,
		] )
	);

	return (
		<div className="jp-forms__page-navigation">
			<button
				disabled={ currentPage === 1 }
				className="jp-forms__page-navigation-button"
				onClick={ goToPrevious }
			>
				<Gridicon icon="arrow-left" size={ 18 } />
				{ __( 'Previous', 'jetpack-forms' ) }
			</button>

			{ map( totalRange, ( n, index ) =>
				! isFinite( n ) ? (
					<button
						key={ `placeholder-${ index }` }
						className="jp-forms__page-navigation-placeholder"
						disabled
					>
						…
					</button>
				) : (
					<PageNumber
						key={ n }
						className="jp-forms__page-navigation-button"
						active={ n === currentPage }
						page={ n }
						onSelect={ onSelectPage }
					/>
				)
			) }

			<button
				disabled={ currentPage === pages }
				className="jp-forms__page-navigation-button"
				onClick={ goToNext }
			>
				{ __( 'Next', 'jetpack-forms' ) }
				<Gridicon icon="arrow-right" size={ 18 } />
			</button>
		</div>
	);
};

export default PageNavigation;
