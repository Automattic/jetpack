import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { useIsMutating } from '@tanstack/react-query';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice, Stack } from '@wordpress/ui';
import { WRITES_KEY, useSettings, useStatus } from './data/queries';
import { useScrollToHash } from './hooks/use-scroll-to-hash';
import { useUnsavedChangesWarning } from './hooks/use-unsaved-changes-warning';
import { getSharingLikesScriptData } from './script-data';
import { CommentLikesSection } from './sections/comment-likes-section';
import { LikeButtonsSection } from './sections/like-buttons-section';
import { OtherSettingsSection } from './sections/other-settings-section';
import { PlacementSection } from './sections/placement-section';
import { SharingButtonsSection } from './sections/sharing-buttons-section';
import type { JSX } from 'react';

/**
 * Sharing sources cut multibyte text mid-character without mbstring.
 *
 * @return Notice.
 */
function MultibyteWarning(): JSX.Element {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>
				{ __( 'Warning! Multibyte support missing!', 'jetpack-sharing-likes' ) }
			</Notice.Title>
			<Notice.Description>
				{ createInterpolateElement(
					__(
						'This plugin will work without it, but multibyte support is used <a>if available</a>. You may see minor problems with Tweets and other sharing services.',
						'jetpack-sharing-likes'
					),
					{
						a: (
							<Link
								href="https://www.php.net/manual/en/mbstring.installation.php"
								target="_blank"
								rel="noopener noreferrer"
							/>
						),
					}
				) }
			</Notice.Description>
		</Notice.Root>
	);
}

/**
 * The sections, once status and settings are known.
 *
 * @return Sections.
 */
function Sections(): JSX.Element | null {
	const status = useStatus();
	const settings = useSettings();
	useScrollToHash( !! status && !! settings );

	if ( ! status || ! settings ) {
		return null;
	}

	return (
		<>
			<SharingButtonsSection />
			<LikeButtonsSection />
			<CommentLikesSection />
			{ status.placement && <PlacementSection /> }
			<OtherSettingsSection />
		</>
	);
}

/**
 * Settings > Sharing.
 *
 * @return Screen.
 */
export function SettingsScreen(): JSX.Element {
	const scriptData = getSharingLikesScriptData();
	const siteData = getSiteData();
	// The browser can abort a write still in flight when the page unloads.
	useUnsavedChangesWarning( useIsMutating( { mutationKey: WRITES_KEY } ) > 0 );

	return (
		<AdminPage
			title={ __( 'Sharing Settings', 'jetpack-sharing-likes' ) }
			subTitle={ __( 'Choose how readers share and like your posts.', 'jetpack-sharing-likes' ) }
			apiRoot={ siteData?.rest_root }
			apiNonce={ siteData?.rest_nonce }
		>
			<Stack direction="column" gap="lg" className="jetpack-sharing-likes">
				{ ! scriptData ? (
					<Notice.Root intent="error">
						<Notice.Description>
							{ __(
								'Sharing settings could not be loaded. Reload the page to try again.',
								'jetpack-sharing-likes'
							) }
						</Notice.Description>
					</Notice.Root>
				) : (
					<>
						{ ! scriptData.multibyte_supported && <MultibyteWarning /> }
						<Sections />
					</>
				) }
			</Stack>
		</AdminPage>
	);
}
