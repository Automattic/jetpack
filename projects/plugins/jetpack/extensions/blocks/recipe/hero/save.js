/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const RecipeHeroSave = ( { className } ) => (
	<div className={ className }>
		<InnerBlocks.Content />
	</div>
);

export default RecipeHeroSave;
