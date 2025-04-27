import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, Button, ExternalLink } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getSocialAdminPageUrl } from '../../../utils';

export const Placeholder = () => {
	const { tracks } = useAnalytics();
	const [ isOpened, setIsOpened ] = useState( false );

	const enablePublicizeModule = useCallback( () => {
		tracks.recordEvent( 'jetpack_editor_publicize_enable' );
	}, [ tracks ] );

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
			title={ __( 'Share this post', 'jetpack-publicize-components' ) }
			initialOpen={ false }
			onToggle={ trackPlaceholderView }
		>
			<p>
				{ __(
					'Activate the Jetpack Social feature to connect your website to the social media networks you use.',
					'jetpack-publicize-components'
				) }
			</p>
			<Button onClick={ enablePublicizeModule } variant="link" href={ getSocialAdminPageUrl() }>
				{ __( 'Activate Jetpack Social', 'jetpack-publicize-components' ) }
			</Button>
			<div className="components-placeholder__learn-more">
				<ExternalLink href={ getRedirectUrl( 'jetpack-support-publicize' ) }>
					{ __( 'Learn more', 'jetpack-publicize-components' ) }
				</ExternalLink>
			</div>
		</PanelBody>
	);
};
