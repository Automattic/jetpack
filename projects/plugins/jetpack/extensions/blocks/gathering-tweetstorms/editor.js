import { BlockControls } from '@wordpress/block-editor';
import {
	withNotices,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
	Spinner,
} from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import useGatherTweetstorm from './use-gather-tweetstorm';
import './editor.scss';

/**
 * Intercepts the registration of the Core Twitter embed block, and adds functionality
 * to check whether the tweet being embedded is the start of a tweetstorm. If it is, offer
 * to import the tweetstorm.
 *
 * @param {object} blockSettings - The settings of the block being registered.
 * @returns {object} The blockSettings, with our extra functionality inserted.
 */
const addTweetstormToTweets = blockSettings => {
	// Bail if the hook has been triggered by a deprecation.
	if ( blockSettings.isDeprecation ) {
		return blockSettings;
	}

	// Allow hooking into the Twitter embed block pre and post Gutenberg 8.8.
	if ( 'core/embed' !== blockSettings.name ) {
		return blockSettings;
	}

	const { edit: CoreEdit } = blockSettings;

	return {
		...blockSettings,
		edit: withNotices( props => {
			const { noticeOperations, noticeUI, onReplace } = props;
			const { url } = props.attributes;
			const { isGatheringStorm, unleashStorm } = useGatherTweetstorm( {
				onReplace,
			} );

			// Only wrap the Twitter variant of the core/embed block.
			if ( 'twitter' !== props.attributes.providerNameSlug ) {
				return <CoreEdit { ...props } />;
			}

			return (
				<>
					{ noticeUI }
					<BlockControls>
						<ToolbarGroup className="gathering-tweetstorms__embed-toolbar">
							<ToolbarButton
								className="gathering-tweetstorms__embed-toolbar-button"
								onClick={ () => unleashStorm( url, noticeOperations ) }
								label={ __(
									'Import the entire Twitter thread directly into this post.',
									'jetpack'
								) }
								showTooltip={ true }
								disabled={ isGatheringStorm || ! url }
							>
								{ __( 'Unroll', 'jetpack' ) }
							</ToolbarButton>
							{ isGatheringStorm && <ToolbarItem as={ Spinner } /> }
						</ToolbarGroup>
					</BlockControls>
					<CoreEdit { ...props } />
				</>
			);
		} ),
	};
};

addFilter( 'blocks.registerBlockType', 'jetpack/gathering-tweetstorms', addTweetstormToTweets );

export default addTweetstormToTweets;
