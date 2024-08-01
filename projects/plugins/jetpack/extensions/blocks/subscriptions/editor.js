import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import { createBlock } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { atSymbol } from '@wordpress/icons';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import CommandPalette from './command-palette';
import deprecated from './deprecated';
import edit from './edit';
import NewsletterMenu from './menu';
import SubscribePanels from './panel';

const blockName = metadata.name.replace( 'jetpack/', '' );

// Registers Subscribe block.
registerJetpackBlockFromMetadata( metadata, {
	edit,
	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: false,
				blocks: [ 'core/legacy-widget' ],
				isMatch: ( { idBase, instance } ) => {
					if ( ! instance?.raw ) {
						return false;
					}
					return idBase === 'blog_subscription';
				},
				transform: ( { instance } ) => {
					return createBlock( 'jetpack/subscriptions', {
						showSubscribersTotal: instance.raw.show_subscribers_total,
						submitButtonText: instance.raw.subscribe_button,
						subscribePlaceholder: instance.raw.subscribe_placeholder,
						successMessage: instance.raw.success_message,
					} );
				},
			},
			{
				type: 'block',
				isMultiBlock: false,
				blocks: [ 'core/buttons' ],
				transform: ( props, children ) => {
					if ( ! children?.length ) {
						return createBlock( 'jetpack/subscriptions' );
					}

					const blocks = [];

					children.forEach( button => {
						const text = button?.attributes?.text;
						blocks.push(
							createBlock( 'jetpack/subscriptions', {
								...( text ? { submitButtonText: text } : {} ),
							} )
						);
					} );

					return blocks;
				},
			},
		],
	},
	deprecated,
} );

// Registers slot/fill panels defined via settings.render and command palette commands
registerJetpackPlugin( blockName, {
	render: () => (
		<>
			<SubscribePanels />,
			<NewsletterMenu />,
			<CommandPalette />
		</>
	),
	icon: atSymbol,
} );

// Allows block to be inserted inside core navigation block
addFilter( 'blocks.registerBlockType', 'jetpack-subscriptions-nav-item', ( settings, name ) => {
	if ( name === 'core/navigation' ) {
		return {
			...settings,
			allowedBlocks: [ ...( settings.allowedBlocks ?? [] ), 'jetpack/subscriptions' ],
		};
	}

	return settings;
} );
