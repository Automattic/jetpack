import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import getCategoryWithFallbacks from '../../shared/get-category-with-fallbacks';
import attributes from './attributes';
import edit from './edit';
import avatar1 from './example-avatars/avatar1.jpg';
import avatar2 from './example-avatars/avatar2.jpg';
import avatar3 from './example-avatars/avatar3.jpg';
import Icon from './icon.svg?component';
import save from './save';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'blogging-prompt';
export const title = __( 'Writing Prompt', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description: __( 'Answer a new and inspiring writing prompt each day.', 'jetpack' ),
	icon: {
		src: Icon,
		foreground: getIconColor(),
	},
	category: getCategoryWithFallbacks( 'text' ),
	keywords: [
		_x( 'writing', 'block search term', 'jetpack' ),
		_x( 'blogging', 'block search term', 'jetpack' ),
	],
	supports: {
		align: false,
		alignWide: false,
		anchor: false,
		className: true,
		color: {
			background: true,
			gradients: true,
			link: true,
			text: true,
		},
		customClassName: true,
		html: false,
		inserter: true,
		multiple: false,
		reusable: true,
		spacing: {
			margin: [ 'top', 'bottom' ],
			padding: true,
			blockGap: false,
		},
	},
	edit,
	save,
	attributes,
	styles: [
		{ name: 'block', label: __( 'Block', 'jetpack' ), isDefault: true },
		{ name: 'quote', label: __( 'Quote', 'jetpack' ) },
	],
	example: {
		attributes: {
			answersLink: 'https://wordpress.com/tag/dailyprompt',
			answersLinkText: __( 'View all responses', 'jetpack' ),
			gravatars: [ { url: avatar1 }, { url: avatar2 }, { url: avatar3 } ],
			promptLabel: __( 'Daily writing prompt', 'jetpack' ),
			promptText: __( "What's your favorite place to visit?", 'jetpack' ),
			promptFetched: true,
			promptId: 1234,
			showResponses: true,
			showLabel: true,
			tagsAdded: true,
		},
	},
};
