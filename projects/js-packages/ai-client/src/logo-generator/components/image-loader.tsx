/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import loader from '../assets/images/loader.gif';
/**
 * Types
 */
import type { FC } from 'react';

export const ImageLoader: FC< { className?: string } > = ( { className = null } ) => {
	return (
		<img
			src={ loader }
			alt="Loading"
			className={ clsx( 'jetpack-ai-logo-generator-modal__loader', className ) }
		/>
	);
};
