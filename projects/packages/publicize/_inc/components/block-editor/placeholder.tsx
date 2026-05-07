import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, Button } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { getSocialAdminPageUrl } from '../../utils';

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
			title={ __( 'Share to social media', 'jetpack-publicize-pkg' ) }
			initialOpen={ false }
			onToggle={ trackPlaceholderView }
		>
			<p>
				{ __(
					'Activate the Jetpack Social feature to connect your website to the social media networks you use.',
					'jetpack-publicize-pkg'
				) }
			</p>
			<Button onClick={ enablePublicizeModule } variant="link" href={ getSocialAdminPageUrl() }>
				{ __( 'Activate Jetpack Social', 'jetpack-publicize-pkg' ) }
			</Button>
			<div className="components-placeholder__learn-more">
				<Link openInNewTab href={ getRedirectUrl( 'jetpack-support-publicize' ) }>
					{ __( 'Learn more', 'jetpack-publicize-pkg' ) }
				</Link>
			</div>
		</PanelBody>
	);
};
