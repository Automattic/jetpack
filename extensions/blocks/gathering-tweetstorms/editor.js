/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useGatherTweetstorm from './use-gather-tweetstorm';
import { withNotices, Button, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import { BlockControls } from '@wordpress/editor';

/**
 * Intercepts the registration of the Core Twitter embed block, and adds functionality
 * to check whether the tweet being embedded is the start of a tweetstorm. If it is, offer
 * to import the tweetstorm.
 *
 * @param {object} blockSettings - The settings of the block being registered.
 *
 * @returns {object} The blockSettings, with our extra functionality inserted.
 */
const addTweetstormToTweets = blockSettings => {
	// Bail if this is not the Twitter embed block, or if the hook has been triggered by a deprecation.
	if ( 'core-embed/twitter' !== blockSettings.name || blockSettings.isDeprecation ) {
		return blockSettings;
	}

	const { edit: CoreTweetEdit } = blockSettings;

	blockSettings.attributes.displayedTweetstormNotice = {
		type: 'boolean',
	};

	return {
		...blockSettings,
		edit: withNotices( props => {
			const { noticeOperations, noticeUI, onReplace, setAttributes } = props;
			const { url, displayedTweetstormNotice } = props.attributes;
			const { blocks, unleashStorm } = useGatherTweetstorm( {
				url,
				displayedTweetstormNotice,
				onReplace,
			} );

			useEffect( () => {
				if ( blocks.length > 1 && ! displayedTweetstormNotice ) {
					setAttributes( { displayedTweetstormNotice: true } );

					noticeOperations.removeAllNotices();
					noticeOperations.createNotice( {
						content: (
							<div className="gathering-tweetstorms__embed-import-notice">
								<div className="gathering-tweetstorms__embed-import-message">
									{ __(
										'It looks like this is the first tweet in a Twitter thread. Would you like to import the whole thread directly into this post?',
										'jetpack'
									) }
								</div>
								<Button
									className="gathering-tweetstorms__embed-import-button"
									isLarge
									isPrimary
									onClick={ unleashStorm }
								>
									{ __( 'Unroll thread', 'jetpack' ) }
								</Button>
							</div>
						),
					} );
				}
			}, [
				blocks.length,
				displayedTweetstormNotice,
				noticeOperations,
				unleashStorm,
				setAttributes,
			] );

			return (
				<>
					{ noticeUI }
					<BlockControls>
						<ToolbarGroup>
							<ToolbarButton
								className="gathering-tweetstorms__embed-toolbar-button"
								onClick={ () => setAttributes( { displayedTweetstormNotice: false } ) }
								title={ __( 'Check if this is the start of a Twitter thread.', 'jetpack' ) }
								showTooltip={ true }
							>
								{ __( 'Unroll', 'jetpack' ) }
							</ToolbarButton>
						</ToolbarGroup>
					</BlockControls>
					<CoreTweetEdit { ...props } />
				</>
			);
		} ),
	};
};

addFilter( 'blocks.registerBlockType', 'jetpack/gathering-tweetstorms', addTweetstormToTweets );
