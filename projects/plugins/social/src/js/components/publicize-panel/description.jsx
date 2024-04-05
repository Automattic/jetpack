import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const getDescriptions = () => ( {
	start: __(
		'Start sharing your posts by connecting your social media accounts.',
		'jetpack-social'
	),
	enabled: __(
		'Click on the social icons below to control where you want to share your post.',
		'jetpack-social'
	),
	disabled: __(
		'Use this tool to share your post on all your social media accounts.',
		'jetpack-social'
	),
	noReshare: __( 'Posts can only be shared as they are first published.', 'jetpack-social' ),
	reshare: __(
		'Enable the social media accounts where you want to re-share your post, then click on the "Share post" button below.',
		'jetpack-social'
	),
} );

const getDescription = ( {
	isPublicizeEnabled,
	hasConnections,
	hidePublicizeFeature,
	isPostPublished,
} ) => {
	const descriptions = getDescriptions();

	if ( hidePublicizeFeature ) {
		return descriptions.noReshare;
	}
	if ( ! hasConnections ) {
		return descriptions.start;
	}

	if ( isPostPublished ) {
		// For published posts, always show the reshare description.
		return descriptions.reshare;
	}

	return isPublicizeEnabled ? descriptions.enabled : descriptions.disabled;
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
export default props => <div className={ styles.description }>{ getDescription( props ) }</div>;
