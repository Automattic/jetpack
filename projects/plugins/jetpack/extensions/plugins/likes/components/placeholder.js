import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './placeholder.scss';

export const LikesPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	const { tracks } = useAnalytics();

	const enableLikesModule = () => {
		tracks.recordEvent( 'jetpack_editor_likes_enable' );
		return changeStatus( true );
	};

	return (
		<>
			<p>{ __( 'Activate the Likes feature to allow others to like your posts.', 'jetpack' ) }</p>
			<Button
				disabled={ isModuleActive || isLoading }
				isBusy={ isLoading }
				onClick={ enableLikesModule }
				variant="secondary"
			>
				{ isLoading
					? __( 'Activating Likes', 'jetpack' )
					: __( 'Activate Likes', 'jetpack', /* dummy arg to avoid bad minification */ 0 ) }
			</Button>

			<div className="components-likes-placeholder__learn-more">
				<ExternalLink href={ getRedirectUrl( 'jetpack-support-likes' ) }>
					{ __( 'Learn more about Jetpack Likes.', 'jetpack' ) }
				</ExternalLink>
			</div>
		</>
	);
};
