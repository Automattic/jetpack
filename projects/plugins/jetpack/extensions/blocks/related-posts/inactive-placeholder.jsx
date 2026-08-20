import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite, isSimpleSite } from '@automattic/jetpack-script-data';
import { useAnalytics, getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { Button, Placeholder } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import metadata from './block.json';

const icon = getBlockIconComponent( metadata );

export const InactiveRelatedPostsPlaceholder = ( {
	className,
	changeStatus,
	isLoading,
	enable,
} ) => {
	const { tracks } = useAnalytics();

	const enableFeature = () => {
		tracks.recordEvent( 'jetpack_editor_related_posts_enable' );

		if ( ! isSimpleSite() ) {
			// enable module.
			changeStatus( true );
		}

		// enable option.
		return enable();
	};

	// Track when the placeholder is viewed.
	useEffect( () => {
		tracks.recordEvent( 'jetpack_editor_related_posts_placeholder_view' );
	}, [ tracks ] );

	const supportLink = isWpcomPlatformSite()
		? 'https://wordpress.com/support/related-posts/'
		: getRedirectUrl( 'jetpack-support-related-posts' );

	return (
		<div className={ className }>
			<Placeholder
				icon={ icon }
				instructions={ __(
					"You'll need to activate the Related Posts feature to use this block.",
					'jetpack'
				) }
				label={ metadata.title }
			>
				<Button
					disabled={ isLoading }
					isBusy={ isLoading }
					onClick={ enableFeature }
					variant="secondary"
				>
					{ isLoading
						? __( 'Activating Related Posts', 'jetpack' )
						: __(
								'Activate Related Posts',
								'jetpack',
								/* dummy arg to avoid bad minification */ 0
						  ) }
				</Button>
				<div className="components-placeholder__learn-more">
					<Link openInNewTab href={ supportLink }>
						{ __( 'Learn more about the Related Posts feature.', 'jetpack' ) }
					</Link>
				</div>
			</Placeholder>
		</div>
	);
};
