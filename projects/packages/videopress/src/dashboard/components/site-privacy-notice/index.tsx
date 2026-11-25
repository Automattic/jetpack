import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Notice } from '@wordpress/ui';
import { isPrivateForSiteServerControlled, useSettings } from '../../hooks/use-settings';
import { TAB_PATHS } from '../dashboard-tabs';
import './style.scss';
import type { ReactElement } from 'react';

const ChangeInSettings = () => {
	const navigate = useNavigate();
	return (
		<Notice.ActionButton onClick={ () => navigate( { href: TAB_PATHS.settings } ) }>
			{ __( 'Change in Settings', 'jetpack-videopress-pkg' ) }
		</Notice.ActionButton>
	);
};

/**
 * Says that every video is members-only while the site-wide privacy setting is on,
 * since signed-out visitors otherwise just meet a private-video message with no hint why.
 *
 * @return The notice, or null while the setting is off or still loading.
 */
export default function SitePrivacyNotice(): ReactElement | null {
	const { data } = useSettings();

	if ( ! data?.videoPressVideosPrivateForSite ) {
		return null;
	}

	// On Simple and private Atomic the value follows the site's own Privacy setting.
	const followsSitePrivacy = isPrivateForSiteServerControlled( data );

	return (
		<div className="vp-site-privacy-notice">
			<Notice.Root intent="warning">
				<Notice.Description>
					{ followsSitePrivacy
						? __(
								'Your site is private, so only logged-in users can play your videos. Signed-out visitors see a private-video message instead.',
								'jetpack-videopress-pkg'
							)
						: __(
								'Only logged-in users can play your videos. Signed-out visitors see a private-video message instead, including where your videos are embedded.',
								'jetpack-videopress-pkg'
							) }
				</Notice.Description>
				{ ! followsSitePrivacy && (
					<Notice.Actions>
						<ChangeInSettings />
					</Notice.Actions>
				) }
			</Notice.Root>
		</div>
	);
}
