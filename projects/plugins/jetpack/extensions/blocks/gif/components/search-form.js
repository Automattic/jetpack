/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
/**
 * Internal dependencies
 */

export function SearchForm( { onSubmit, onChange, value = '' }, ref ) {
	return (
		<form
			className="wp-block-jetpack-gif_input-container"
			onSubmit={ onSubmit }
		>
			<input
				type="text"
				className="wp-block-jetpack-gif_input components-placeholder__input"
				placeholder={ __( 'Enter search terms, e.g. cat…', 'jetpack' ) }
				value={ value }
				onChange={ onChange }
				ref={ ref }
				aria-labelledby="wp-block-jetpack-gif_search-button"
			/>
			<Button id="wp-block-jetpack-gif_search-button" isSecondary type="submit">
				{ __( 'Search', 'jetpack' ) }
			</Button>
		</form>
	);
}

export default forwardRef( SearchForm );
