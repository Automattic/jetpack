import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import { name as detailsName, settings as detailsSettings } from './details/';
import edit from './edit';
import { name as heroName, settings as heroSettings } from './hero/';
import icon from './icon';
import { name as ingredientItemName, settings as ingredientItemSettings } from './ingredient-item/';
import {
	name as ingredientsListName,
	settings as ingredientsListSettings,
} from './ingredients-list/';
import save from './save';
import { name as stepName, settings as stepSettings } from './step/';
import { name as stepsName, settings as stepsSettings } from './steps/';

export const name = 'recipe';
export const title = __( 'Recipe', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>
				{ __(
					'Add images, ingredients and cooking steps to display an easy to read recipe.',
					'jetpack'
				) }
			</p>
			<ExternalLink href="#">{ __( 'Learn more about Recipe', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'jetpack',
	keywords: [],
	supports: {
		// Support for block's alignment (left, center, right, wide, full). When true, it adds block controls to change block’s alignment.
		align: [ 'full', 'wide' ] /* if set to true, the 'align' option below can be used*/,
		// Pick which alignment options to display.
		/*align: [ 'left', 'right', 'full' ],*/
		// Support for wide alignment, that requires additional support in themes.
		alignWide: true,
		// When true, a new field in the block sidebar allows to define an id for the block and a button to copy the direct link.
		anchor: false,
		// When true, a new field in the block sidebar allows to define a custom className for the block’s wrapper.
		customClassName: true,
		// When false, Gutenberg won't add a class like .wp-block-your-block-name to the root element of your saved markup
		className: true,
		// Setting this to false suppress the ability to edit a block’s markup individually. We often set this to false in Jetpack blocks.
		html: false,
		// Passing false hides this block in Gutenberg's visual inserter.
		/*inserter: true,*/
		// When false, user will only be able to insert the block once per post.
		multiple: true,
		// When false, the block won't be available to be converted into a reusable block.
		reusable: true,
	},
	edit,
	save,
};

export const childBlocks = [
	{ name: detailsName, settings: detailsSettings },
	{ name: heroName, settings: heroSettings },
	{ name: ingredientsListName, settings: ingredientsListSettings },
	{ name: ingredientItemName, settings: ingredientItemSettings },
	{ name: stepsName, settings: stepsSettings },
	{ name: stepName, settings: stepSettings },
];
