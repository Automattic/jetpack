import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './placeholder.scss';

export const SharingPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	const { tracks } = useAnalytics();

	const enableSharingModule = () => {
		tracks.recordEvent( 'jetpack_editor_sharing_enable' );
		return changeStatus( true );
	};

	return (
		<>
			<p>{ __( 'Activate the Sharing feature allowing others sharing your posts.', 'jetpack' ) }</p>
			<Button
				disabled={ isModuleActive || isLoading }
				isBusy={ isLoading }
				onClick={ enableSharingModule }
				variant="secondary"
			>
				{ isLoading
					? __( 'Activating Jetpack Sharing', 'jetpack' )
					: __(
							'Activate Jetpack Sharing',
							'jetpack',
							/* dummy arg to avoid bad minification */ 0
					  ) }
			</Button>

			<div className="components-placeholder__learn-more">
				<ExternalLink href={ getRedirectUrl( 'jetpack-support-sharing' ) }>
					{ __( 'Learn more about Jetpack Sharing.', 'jetpack' ) }
				</ExternalLink>
			</div>
		</>
	);
};
