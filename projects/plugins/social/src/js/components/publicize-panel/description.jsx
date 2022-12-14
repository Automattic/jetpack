import { __ } from '@wordpress/i18n';

const descriptions = {
	start: __(
		'Start sharing your posts by connecting your social media accounts.',
		'jetpack-social'
	),
	enabled: __(
		'This post will be shared on all your enabled social media accounts the moment you publish the post.',
		'jetpack-social'
	),
	disabled: __(
		'Use this tool to share your post on all your social media accounts.',
		'jetpack-social'
	),
	published: __( 'Posts can only be shared as they are first published.', 'jetpack-social' ),
	reshare: __(
		'Share this post on all your enabled social media accounts by clicking on the share post button.',
		'jetpack-social'
	),
};

const getDescription = ( {
	isPublicizeEnabled,
	hasConnections,
	hasEnabledConnections,
	hidePublicizeFeature,
	isPostPublished,
} ) => {
	if ( hidePublicizeFeature ) {
		return descriptions.published;
	}
	if ( ! hasConnections ) {
		return descriptions.start;
	}
	if ( ! isPublicizeEnabled || ! hasEnabledConnections ) {
		return descriptions.disabled;
	}
	if ( isPublicizeEnabled && hasEnabledConnections && ! isPostPublished ) {
		return descriptions.enabled;
	}
	return descriptions.reshare;
};

/**
 * A component that renders a contextual description for
 * the Publicize publishing panel.
 *
 * @param {object} props                        - The component properties.
 * @param {boolean} props.hidePublicizeFeature  - Whether the publicize feature is available or not.
 * @param {boolean} props.isPublicizeEnabled    - Whether the main publicize toggle is enabled.
 * @param {boolean} props.hasConnections        - Whether we have any Publicize connections.
 * @param {boolean} props.hasEnabledConnections - Whether any connections are enabled.
 * @returns {object} The description component.
 */
export default props => <div>{ getDescription( props ) }</div>;
