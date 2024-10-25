import { registerJetpackPlugin, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { createBlock } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { PluginPreviewMenuItem } from '@wordpress/editor';
import { useState, useCallback } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { atSymbol, send } from '@wordpress/icons';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import CommandPalette from './command-palette';
import deprecated from './deprecated';
import edit from './edit';
import { NewsletterPreviewModal } from './email-preview';
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

const shouldShowNewsletterMenu = () => {
	const postType = select( 'core/editor' ).getCurrentPostType();
	const isPost = postType === 'post';
	return isPost;
};

const useNewsletterPreview = () => {
	const [ isPreviewModalOpen, setIsPreviewModalOpen ] = useState( false );
	const postId = select( 'core/editor' ).getCurrentPostId();
	const { tracks } = useAnalytics();

	const openPreviewModal = useCallback(
		source => {
			setIsPreviewModalOpen( true );
			tracks.recordEvent( 'jetpack_newsletter_preview_opened', { source } );
		},
		[ tracks ]
	);

	const closePreviewModal = useCallback( () => {
		setIsPreviewModalOpen( false );
	}, [] );

	return { isPreviewModalOpen, openPreviewModal, closePreviewModal, postId };
};

const NewsletterEditor = () => {
	const { isPreviewModalOpen, openPreviewModal, closePreviewModal, postId } =
		useNewsletterPreview();

	return (
		<>
			<SubscribePanels />
			{ shouldShowNewsletterMenu() && (
				<>
					{ PluginPreviewMenuItem ? (
						<PluginPreviewMenuItem
							onClick={ () => openPreviewModal( 'preview_menu' ) }
							icon={ send }
						>
							{ __( 'Email preview', 'jetpack' ) }
						</PluginPreviewMenuItem>
					) : null }
					<NewsletterPreviewModal
						isOpen={ isPreviewModalOpen }
						onClose={ closePreviewModal }
						postId={ postId }
					/>
					<NewsletterMenu openPreviewModal={ () => openPreviewModal( 'newsletter_menu' ) } />
				</>
			) }
			<CommandPalette />
		</>
	);
};

registerJetpackPlugin( blockName, {
	render: () => <NewsletterEditor />,
	icon: shouldShowNewsletterMenu() ? atSymbol : undefined,
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
