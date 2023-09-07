import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { icon, settings } from './';

export const InactiveRelatedPostsModulePlaceholder = ( {
	changeStatus,
	isLoading,
	isModuleActive,
} ) => {
	const { tracks } = useAnalytics();

	const enableModule = () => {
		tracks.recordEvent( 'jetpack_editor_related_posts_enable' );
		return changeStatus( true );
	};

	// Track when the placeholder is viewed.
	useEffect( () => {
		tracks.recordEvent( 'jetpack_editor_related_posts_placeholder_view' );
	}, [ tracks ] );

	return (
		<Placeholder
			icon={ icon }
			instructions={ __(
				"You'll need to activate the Related Posts feature to use this block.",
				'jetpack'
			) }
			label={ settings.title }
		>
			<Button
				disabled={ isModuleActive || isLoading }
				isBusy={ isLoading }
				onClick={ enableModule }
				variant="secondary"
			>
				{ isLoading
					? __( 'Activating Related Posts', 'jetpack' )
					: __( 'Activate Related Posts', 'jetpack', /* dummy arg to avoid bad minification */ 0 ) }
			</Button>
			<div className="membership-button__disclaimer">
				<ExternalLink href={ getRedirectUrl( 'jetpack-support-related-posts' ) }>
					{ __( 'Learn more about the Related Posts feature.', 'jetpack' ) }
				</ExternalLink>
			</div>
		</Placeholder>
	);
};
