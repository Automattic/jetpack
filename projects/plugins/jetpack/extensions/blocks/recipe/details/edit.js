/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';

function RecipeDetailsEdit( { className, context } ) {
	return (
		<div className={ className }>
			<div className="wp-container wp-recipe-block-details">
				<TextControl
					label={ __( 'Prep time', 'jetpack' ) }
					value={ context[ 'jetpack/recipe-prepTime' ] }
					disabled
				/>
				<TextControl
					label={ __( 'Cook time', 'jetpack' ) }
					value={ context[ 'jetpack/recipe-cookTime' ] }
					disabled
				/>
				<TextControl
					label={ __( 'Servings', 'jetpack' ) }
					value={ context[ 'jetpack/recipe-servings' ] }
					disabled
				/>
			</div>
		</div>
	);
}

export default RecipeDetailsEdit;
