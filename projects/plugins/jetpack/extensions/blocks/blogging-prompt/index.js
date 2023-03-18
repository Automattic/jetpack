import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import getCategoryWithFallbacks from '../../shared/get-category-with-fallbacks';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
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
	description: (
		<Fragment>
			<p>{ __( 'Answer a new and inspiring writing prompt each day.', 'jetpack' ) }</p>
			{ /* @TODO add link */ }
			<ExternalLink href="#">{ __( 'Learn more.', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),
	icon: {
		src: icon,
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
			gravatars: [
				{ url: 'https://0.gravatar.com/avatar/1234?s=96&d=identicon&r=G' },
				{ url: 'https://1.gravatar.com/avatar/5678?s=96&d=identicon&r=G' },
				{ url: 'https://2.gravatar.com/avatar/9012?s=96&d=identicon&r=G' },
			],
			promptLabel: __( 'Daily writing prompt', 'jetpack' ),
			promptText: 'Write about your favorite place to visit.',
			promptFetched: true,
			promptId: 1234,
			showResponses: true,
			showLabel: true,
			tagsAdded: true,
		},
	},
};
