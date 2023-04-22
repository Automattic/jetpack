import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'ai-assistant';
export const title = __( 'AI Assistant', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description: (
		<Fragment>
			<p>{ __( 'Automatically generate and modify content, powered by AI magic.', 'jetpack' ) }</p>
			<p>
				{ __(
					'We are experimenting with this feature and can tweak or remove it at any point.',
					'jetpack'
				) }
			</p>
			<ExternalLink href={ getRedirectUrl( 'jetpack_ai_feedback' ) }>
				{ __( 'Share your feedback.', 'jetpack' ) }
			</ExternalLink>
		</Fragment>
	),
	icon: {
		src: 'superhero',
		foreground: getIconColor(),
	},
	category: 'text',
	keywords: [
		_x( 'AI', 'block search term', 'jetpack' ),
		_x( 'GPT', 'block search term', 'jetpack' ),
		_x( 'AL', 'block search term', 'jetpack' ),
		_x( 'Magic', 'block search term', 'jetpack' ),
	],
	supports: {
		// Setting this to false suppress the ability to edit a block’s markup individually. We often set this to false in Jetpack blocks.
		html: false,
		// Passing false hides this block in Gutenberg's visual inserter.
		/*inserter: true,*/
		// When false, user will only be able to insert the block once per post.
		multiple: true,
		// When false, the block won't be available to be converted into a reusable block.
		reusable: false,
	},
	edit,
	save: () => null,
	attributes,
	transforms: {},
	example: {
		attributes: {
			animationDone: false,
			content: __( "I'm afraid I can't do that, Dave.", 'jetpack' ),
		},
	},
};
