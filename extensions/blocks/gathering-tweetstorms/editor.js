/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings } from '.';
import useGatherTweetstorm from './use-gather-tweetstorm';
import { withNotices, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';

registerJetpackBlock( name, settings );

/**
 * Intercepts the registration of the Core Twitter embed block, and adds functionality
 * to check whether the tweet being embedded is the start of a tweetstorm. If it is, offer
 * to import the tweetstorm.
 *
 * @param {object} blockSettings - The settings of the block being registered.
 * @param {string} blockName - The name of the block being registered.
 *
 * @returns {object} The blockSettings, with our extra functionality inserted.
 */
const addTweetstormToTweets = ( blockSettings, blockName ) => {
	// Bail if this is not the Twitter embed block or if the hook has been triggered by a deprecation.
	if ( 'core-embed/twitter' !== blockName || blockSettings.isDeprecation ) {
		return blockSettings;
	}

	const { edit: CoreTweetEdit } = blockSettings;

	return {
		...blockSettings,
		edit: withNotices( props => {
			const { noticeOperations, noticeUI, onReplace } = props;
			const [ messageDisplayed, setMessageDisplayed ] = useState( false );
			const { blocks, unleashStorm } = useGatherTweetstorm( {
				url: props.attributes.url,
				onReplace,
			} );

			useEffect( () => {
				if ( blocks.length > 1 && ! messageDisplayed ) {
					setMessageDisplayed( true );

					noticeOperations.removeAllNotices();
					noticeOperations.createNotice( {
						content: (
							<div className="gathering-tweetstorms__embed-import-notice">
								<div className="gathering-tweetstorms__embed-import-message">
									{ __(
										'It looks like this is the first tweet in a tweetstorm. Would you like to import the tweetstorm content directly into this post?',
										'jetpack'
									) }
								</div>
								<Button
									className="gathering-tweetstorms__embed-import-button"
									isLarge
									isPrimary
									onClick={ unleashStorm }
								>
									{ __( 'Import Tweetstorm', 'jetpack' ) }
								</Button>
							</div>
						),
					} );
				}
			}, [ blocks.length, messageDisplayed, setMessageDisplayed, noticeOperations, unleashStorm ] );

			return (
				<>
					{ noticeUI }
					<CoreTweetEdit { ...props } />
				</>
			);
		} ),
	};
};

addFilter( 'blocks.registerBlockType', 'jetpack/gathering-tweetstorms', addTweetstormToTweets );
