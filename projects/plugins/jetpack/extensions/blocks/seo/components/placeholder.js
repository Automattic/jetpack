import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './placeholder.scss';

export const SeoPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	const { tracks } = useAnalytics();

	const enableSeoModule = () => {
		tracks.recordEvent( 'jetpack_editor_seo_enable' );
		return changeStatus( true );
	};

	return (
		<>
			<p>{ __( 'Activate Seo feature to optimize your site for search engines.', 'jetpack' ) }</p>
			<Button
				disabled={ isModuleActive || isLoading }
				isBusy={ isLoading }
				onClick={ enableSeoModule }
				variant="secondary"
			>
				{ isLoading
					? __( 'Activating Jetpack Seo', 'jetpack' )
					: __( 'Activate Jetpack Seo', 'jetpack', 0 ) }
			</Button>

			<div className="components-placeholder__learn-more">
				<ExternalLink href={ getRedirectUrl( 'jetpack-support-seo-tools' ) }>
					{ __( 'Learn more about Jetpack Seo.', 'jetpack' ) }
				</ExternalLink>
			</div>
		</>
	);
};
