/**
 * WordPress dependencies.
 */
import { Path, SVG } from '@wordpress/components';

/**
 * External dependencies.
 */
import classnames from 'classnames';

const NewspackIcon = ( { size = 24, className } ) => (
	<SVG
		className={ classnames( 'newspack-icon', className ) }
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
	>
		<Path
			className="newspack-icon__circle"
			fill="#003da5"
			d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
		/>
		<Path
			className="newspack-icon__n"
			fill="#fff"
			d="M16.546 13.97v-1.364h-1.364l1.364 1.364ZM13.97 11.394h2.575V10.03h-3.939l1.364 1.364ZM11.394 8.818h5.152V7.455H10.03l1.364 1.363ZM7.455 7.455l9.09 9.09H13.97l-4.697-4.697v4.697H7.455v-9.09Z"
		/>
	</SVG>
);

export default NewspackIcon;
