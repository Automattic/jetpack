import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import './wpcom-tour-kit-pagination-control.scss';

interface Props {
	onChange: ( page: number ) => void;
	activePageIndex: number;
	numberOfPages: number;
	classNames?: string | string[];
	children?: React.ReactNode;
}

const WpcomTourKitPaginationControl: React.FunctionComponent< Props > = ( {
	activePageIndex,
	numberOfPages,
	onChange,
	classNames,
	children,
} ) => {
	const classes = clsx( 'wpcom-tour-kit-pagination-control', classNames );

	return (
		<ul className={ classes } aria-label={ __( 'Pagination control', 'jetpack-mu-wpcom' ) }>
			{ Array.from( { length: numberOfPages } ).map( ( value, index ) => (
				<li
					key={ `${ numberOfPages }-${ index }` }
					aria-current={ index === activePageIndex ? 'page' : undefined }
				>
					<button
						className={ clsx( 'pagination-control__page', {
							'is-current': index === activePageIndex,
						} ) }
						disabled={ index === activePageIndex }
						aria-label={ sprintf(
							/* translators: 1: current page number 2: total number of pages */
							__( 'Page %1$d of %2$d', 'jetpack-mu-wpcom' ),
							index + 1,
							numberOfPages
						) }
						onClick={ () => onChange( index ) }
					/>
				</li>
			) ) }
			{ children && <li className="pagination-control__last-item">{ children }</li> }
		</ul>
	);
};

export default WpcomTourKitPaginationControl;
