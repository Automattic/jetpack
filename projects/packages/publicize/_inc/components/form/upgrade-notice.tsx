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
 * A notice for upgrading to a plan that supports the Enhanced Publishing feature.
 *
 * @return The UpgradeNotice component.
 */
export function UpgradeNotice() {
	const redirectUrl = getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
		site: getSiteFragment() || '',
		query: 'redirect_to=' + encodeURIComponent( window.location.href ),
	} );

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( redirectUrl );

	if ( isSimpleSite() ) {
		// We don't have any upgrade options on Simple sites, yet.
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
					/**
					 * At the time of writing, Notice action does not support disabled or busy state,
					 * @see https://github.com/WordPress/gutenberg/issues/74090
					 */
					// So we prevent onClick when redirecting.
					onClick: isRedirecting ? undefined : autosaveAndRedirect,
					className: clsx( 'is-compact', {
						// Because of the above, we add a busy class for styling purposes.
						'is-busy': isRedirecting,
					} ),
				},
				{
					variant: 'secondary',
					label: __( 'View demo', 'jetpack-publicize-pkg' ),
					noDefaultClasses: true,
					className: 'is-compact',
					url: getRedirectUrl( 'jetpack-social-landing-page' ),
				},
			] }
		>
			{ __( 'Choose your social media image or video to share.', 'jetpack-publicize-pkg' ) }
		</Notice>
	);
}
