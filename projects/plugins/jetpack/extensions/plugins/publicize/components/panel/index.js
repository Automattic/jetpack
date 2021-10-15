/**
 * Publicize sharing panel component.
 *
 * Displays Publicize notifications if no
 * services are connected or displays form if
 * services are connected.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, ToggleControl, Button } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PublicizeConnectionVerify from '../connection-verify';
import PublicizeForm from '../form';
import PublicizeTwitterOptions from '../twitter/options';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSharePost from '../../hooks/use-share-post';

function getPanelDescription(
	isPostPublished,
	isRePublicizeFeatureEnabled,
	isPublicizeEnabled,
	hasConnections,
	hasEnabledConnections
) {
	// Use constants when the string is used in multiple places.
	const start_your_posts_string = __(
		'Start sharing your posts by connecting your social media accounts.',
		'jetpack'
	);
	const this_post_will_string = __(
		'This post will be shared on all your enabled social media accounts the moment you publish the post.',
		'jetpack'
	);

	// RePublicize feature is disabled.
	if ( ! isRePublicizeFeatureEnabled ) {
		if ( isPostPublished ) {
			return start_your_posts_string;
		}

		return this_post_will_string;
	}

	// RePublicize feature is enabled.
	// No connections.
	if ( ! hasConnections ) {
		return start_your_posts_string;
	}

	if ( ! isPublicizeEnabled || ! hasEnabledConnections ) {
		return __( 'Use this tool to share your post on all your social media accounts.', 'jetpack' );
	}

	if ( isPublicizeEnabled && hasEnabledConnections && ! isPostPublished ) {
		return this_post_will_string;
	}

	return __(
		'Share this post on all your enabled social media accounts by clicking on the share post button.',
		'jetpack'
	);
}

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();

	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	/*
	 * Check whether the Republicize feature is enabled.
	 * it can be defined via the `jetpack_block_editor_republicize_feature` backend filter.
	 */
	const {
		isRePublicizeFeatureEnabled,
		isPublicizeEnabled,
		togglePublicizeFeature,
	} = usePublicizeConfig();

	// Refresh connections when the post is just published.
	usePostJustPublished(
		function () {
			if ( ! hasEnabledConnections ) {
				return;
			}

			refresh();
		},
		[ hasEnabledConnections, refresh ]
	);

	// Testing post sharing function handler.
	// @TODO: replace with the final implementation
	const onPostShareHander = useSharePost( function ( error, results ) {
		if ( error ) {
			// eslint-disable-next-line no-console
			return console.log( { error } );
		}

		// eslint-disable-next-line no-console
		console.log( 'results: ', { results } );
	} );

	return (
		<PanelBody title={ __( 'Share this post', 'jetpack' ) }>
			<div>
				{ getPanelDescription(
					isPostPublished,
					isRePublicizeFeatureEnabled,
					isPublicizeEnabled,
					hasConnections,
					hasEnabledConnections
				) }
			</div>

			{ isRePublicizeFeatureEnabled && (
				<PanelRow>
					<ToggleControl
						label={
							isPublicizeEnabled
								? __( 'Sharing is enabled', 'jetpack' )
								: __( 'Sharing is disabled', 'jetpack' )
						}
						onChange={ togglePublicizeFeature }
						checked={ isPublicizeEnabled }
						disabled={ ! hasConnections }
					/>
				</PanelRow>
			) }

			<PublicizeConnectionVerify />
			<PublicizeForm
				isPublicizeEnabled={ isPublicizeEnabled }
				isRePublicizeFeatureEnabled={ isRePublicizeFeatureEnabled }
			/>
			<PublicizeTwitterOptions prePublish={ prePublish } />
			{ isRePublicizeFeatureEnabled && (
				<Button isSecondary onClick={ onPostShareHander }>
					{ __( 'Share post', 'jetpack' ) }
				</Button>
			) }
		</PanelBody>
	);
};

export default PublicizePanel;
