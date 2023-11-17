import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, Button, ExternalLink } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const PublicizePlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	const { tracks } = useAnalytics();
	const [ isOpened, setIsOpened ] = useState( false );

	const enablePublicizeModule = () => {
		tracks.recordEvent( 'jetpack_editor_publicize_enable' );
		return changeStatus( true );
	};

	// Track when the placeholder is viewed.
	const trackPlaceholderView = useCallback( () => {
		// Do not trigger it once the panel is opened and being closed.
		if ( isOpened ) {
			return;
		}

		setIsOpened( true );
		tracks.recordEvent( 'jetpack_editor_publicize_placeholder_view' );
	}, [ isOpened, tracks ] );

	return (
		<PanelBody
			className="jetpack-publicize__placeholder"
			title={ __( 'Share this post', 'jetpack' ) }
			initialOpen={ false }
			onToggle={ trackPlaceholderView }
		>
			<p>
				{ __(
					'Activate the Jetpack Social feature to connect your website to the social media networks you use.',
					'jetpack'
				) }
			</p>
			<Button
				disabled={ isModuleActive || isLoading }
				isBusy={ isLoading }
				onClick={ enablePublicizeModule }
				variant="secondary"
			>
				{ isLoading
					? __( 'Activating Jetpack Social', 'jetpack' )
					: __(
							'Activate Jetpack Social',
							'jetpack',
							/* dummy arg to avoid bad minification */ 0
					  ) }
			</Button>
			<div className="components-placeholder__learn-more">
				<ExternalLink href={ getRedirectUrl( 'jetpack-support-publicize' ) }>
					{ __( 'Learn more about Jetpack Social.', 'jetpack' ) }
				</ExternalLink>
			</div>
		</PanelBody>
	);
};
