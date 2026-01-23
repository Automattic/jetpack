import { getRedirectUrl } from '@automattic/jetpack-components';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import {
	getSiteFragment,
	useAutosaveAndRedirect,
} from '@automattic/jetpack-shared-extension-utils';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';

/**
 * A notice for upgrading to a plan that supports per-network customization.
 *
 * @return The UpgradeNoticeCustomisation component.
 */
export function UpgradeNoticeCustomisation() {
	const redirectUrl = getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
		site: getSiteFragment() || '',
		query: 'redirect_to=' + encodeURIComponent( window.location.href ),
	} );

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( redirectUrl );

	if ( isSimpleSite() ) {
		return null;
	}

	return (
		<Notice
			isDismissible={ false }
			status="info"
			actions={ [
				{
					variant: 'primary',
					label: __( 'Upgrade now', 'jetpack-publicize-pkg' ),
					onClick: isRedirecting ? undefined : autosaveAndRedirect,
					className: clsx( 'is-compact', {
						'is-busy': isRedirecting,
					} ),
				},
			] }
		>
			{ __(
				'Customize images and messages for each account for better performance.',
				'jetpack-publicize-pkg'
			) }
		</Notice>
	);
}
