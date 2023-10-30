import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	isAtomicSite,
	isSimpleSite,
	useAnalytics,
	getBlockIconComponent,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
		let featureEnabled = false;
		tracks.recordEvent( 'jetpack_editor_related_posts_enable' );

		if ( ! isSimpleSite() ) {
			// enable module.
			featureEnabled = changeStatus( true );
		}

		// enable option.
		featureEnabled = enable();

		return featureEnabled;
	};

	// Track when the placeholder is viewed.
	useEffect( () => {
		tracks.recordEvent( 'jetpack_editor_related_posts_placeholder_view' );
	}, [ tracks ] );

	const supportLink =
		isSimpleSite() || isAtomicSite()
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
					<ExternalLink href={ supportLink }>
						{ __( 'Learn more about the Related Posts feature.', 'jetpack' ) }
					</ExternalLink>
				</div>
			</Placeholder>
		</div>
	);
};
