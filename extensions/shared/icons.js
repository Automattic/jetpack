/**
 * External dependencies
 */
import { Path, Polygon, SVG } from '@wordpress/components';
import classNames from 'classnames';

export const PexelsIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M14 7H9v10h3.9v-3.8H14c1.7 0 3.1-1.4 3.1-3.1C17.2 8.4 15.8 7 14 7z" />
		<Path d="M20.5 2h-17C2.7 2 2 2.7 2 3.5v17c0 .8.7 1.5 1.5 1.5h17c.8 0 1.5-.7 1.5-1.5v-17c0-.8-.7-1.5-1.5-1.5zm-5.6 13.2V19H7V5h7c2.8 0 5.1 2.3 5.1 5.1.1 2.5-1.8 4.7-4.2 5.1z" />
	</SVG>
);

export const JetpackLogo = ( { size = 24, className } ) => (
	<SVG
		className={ classNames( 'jetpack-logo', className ) }
		width={ size }
		height={ size }
		viewBox="0 0 32 32"
	>
		<Path
			className="jetpack-logo__icon-circle"
			fill="#00be28"
			d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z"
		/>
		<Polygon className="jetpack-logo__icon-triangle" fill="#fff" points="15,19 7,19 15,3 " />
		<Polygon className="jetpack-logo__icon-triangle" fill="#fff" points="17,29 17,13 25,13 " />
	</SVG>
);
