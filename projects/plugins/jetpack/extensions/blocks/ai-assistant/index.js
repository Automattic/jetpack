/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
/**
 * Internal dependencies
 */
import attributes from './attributes';
import AiAssistantPluginSidebar from './components/ai-assistant-plugin-sidebar';
import edit from './edit';
import Icon from './icons/ai-assistant';
import transforms from './transforms';
/**
 * Supports and extensions
 */
import './supports';
import './extensions/ai-assistant';
/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'ai-assistant';
export const blockName = `jetpack/${ name }`;
export const title = __( 'AI Assistant (Experimental)', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description: (
		<Fragment>
			<p>{ __( 'Automatically generate and modify content, powered by AI magic.', 'jetpack' ) }</p>
			<p>
				{ __(
					'The AI Assistant can be imprecise with information about people, places, or facts.',
					'jetpack'
				) }
			</p>
			<p>
				{ __(
					'We are experimenting with this feature and can tweak or remove it at any point.',
					'jetpack'
				) }
			</p>
			<p>
				<ExternalLink href="https://automattic.com/ai-guidelines">
					{ __( 'AI guidelines.', 'jetpack' ) }
				</ExternalLink>
			</p>
			<ExternalLink href={ getRedirectUrl( 'jetpack_ai_feedback' ) }>
				{ __( 'Share your feedback.', 'jetpack' ) }
			</ExternalLink>
		</Fragment>
	),
	icon: {
		src: Icon,
		foreground: getIconColor(),
	},
	category: 'text',
	keywords: [
		_x( 'AI', 'block search term', 'jetpack' ),
		_x( 'GPT', 'block search term', 'jetpack' ),
		_x( 'AL', 'block search term', 'jetpack' ),
		_x( 'Magic', 'block search term', 'jetpack' ),
		_x( 'help', 'block search term', 'jetpack' ),
		_x( 'assistant', 'block search term', 'jetpack' ),
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
	transforms,
	example: {
		attributes: {
			content: __( "I'm afraid I can't do that, Dave.", 'jetpack' ),
			originalContent: __( "I'm afraid I can't do that, Dave.", 'jetpack' ),
		},
	},
};

// plugin settings
export const pluginSettings = {
	render: () => <AiAssistantPluginSidebar />,
};
