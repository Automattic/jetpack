/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import useGatherTweetstorm from './use-gather-tweetstorm';
import { withNotices, Button, ToolbarGroup, Toolbar, Spinner } from '@wordpress/components';
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

	return {
		...blockSettings,
		edit: withNotices( props => {
			const { noticeOperations, noticeUI, onReplace } = props;
			const { url } = props.attributes;
			const { isGatheringStorm, unleashStorm } = useGatherTweetstorm( {
				onReplace,
			} );

			return (
				<>
					{ noticeUI }
					<BlockControls>
						{ /* @todo Fallback can be removed when WP 5.4 is the minimum supported version. */ }
						{ ToolbarGroup ? (
							<ToolbarGroup className="gathering-tweetstorms__embed-toolbar">
								<Button
									className="gathering-tweetstorms__embed-toolbar-button"
									onClick={ () => unleashStorm( url, noticeOperations ) }
									label={ __(
										'Import the entire Twitter thread directly into this post.',
										'jetpack'
									) }
									showTooltip={ true }
									disabled={ isGatheringStorm }
								>
									{ __( 'Unroll', 'jetpack' ) }
								</Button>
								{ isGatheringStorm && <Spinner /> }
							</ToolbarGroup>
						) : (
							<Toolbar
								className="gathering-tweetstorms__embed-toolbar"
								controls={ [
									{
										title: __(
											'Import the entire Twitter thread directly into this post.',
											'jetpack'
										),
										onClick: () => unleashStorm( url, noticeOperations ),
										extraProps: {
											className: 'gathering-tweetstorms__embed-toolbar-button',
											children: __( 'Unroll', 'jetpack' ),
											disabled: isGatheringStorm,
										},
									},
								] }
							>
								{ isGatheringStorm && <Spinner /> }
							</Toolbar>
						) }
					</BlockControls>
					<CoreTweetEdit { ...props } />
				</>
			);
		} ),
	};
};

addFilter( 'blocks.registerBlockType', 'jetpack/gathering-tweetstorms', addTweetstormToTweets );
