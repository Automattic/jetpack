import { CONNECTION_FROM } from '@automattic/jetpack-connection/connection-from';
import { getUserConnectionUrl } from '@automattic/jetpack-connection/get-user-connection-url';
import { __, _x } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useCallback } from 'react';
import { showSuccessSnackbar } from '../../data/notices';
import { getPageData, getSectionState } from '../../data/state';
import { trackAdsEvent, trackBannerClick } from '../../data/tracking';
import { useAdsAccount, useJoinWordAds } from '../../data/wordads';
import type { AdsSettingsData } from '../../data/ads-settings-data';

const trackConnectClick = () => trackBannerClick( 'connect' );
const trackUpgradeClick = () => trackBannerClick( 'upgrade' );

/**
 * What the Settings card showed instead of the Ads options without a WordAds plan.
 *
 * @param props      - Component props.
 * @param props.data - The Settings tab's server data.
 * @return The upgrade prompt, or the connect prompt without a connected owner.
 */
export function AdsPrompt( { data }: { data: AdsSettingsData } ) {
	if ( ! data.hasConnectedOwner ) {
		return (
			<Notice.Root intent="info">
				<Notice.Description>
					{ __(
						'Connect your WordPress.com account to upgrade and generate income with high-quality ads.',
						'jetpack-monetize'
					) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionLink
						href={ getUserConnectionUrl( {
							from: CONNECTION_FROM.jetpackMonetizeSettings,
							redirect_url: window.location.href,
						} ) }
						onClick={ trackConnectClick }
					>
						{ _x(
							'Connect',
							'A caption for a button to connect a user account to access paid features.',
							'jetpack-monetize'
						) }
					</Notice.ActionLink>
				</Notice.Actions>
			</Notice.Root>
		);
	}

	const { upgradeUrl } = getPageData();

	return (
		<Notice.Root intent="info">
			<Notice.Description>
				{ __( 'Generate income with high-quality ads.', 'jetpack-monetize' ) }
			</Notice.Description>
			{ upgradeUrl && (
				<Notice.Actions>
					<Notice.ActionLink href={ upgradeUrl } onClick={ trackUpgradeClick }>
						{ _x(
							'Upgrade',
							'A caption for a button to upgrade an existing paid feature to a higher tier.',
							'jetpack-monetize'
						) }
					</Notice.ActionLink>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}

/**
 * Simple's way to join WordAds, which the site must do before it can switch ads on.
 *
 * @return The prompt.
 */
export function JoinPrompt() {
	const { data: account } = useAdsAccount();
	const join = useJoinWordAds();
	const { mutate } = join;
	const onJoin = useCallback(
		() =>
			mutate( undefined, {
				onSuccess: () => {
					trackAdsEvent( 'join' );
					showSuccessSnackbar(
						__( 'Your site joined WordAds. Turn on ads to start earning.', 'jetpack-monetize' )
					);
				},
			} ),
		[ mutate ]
	);

	if ( ! getSectionState< { canJoinWordAds?: boolean } >( 'ads' )?.canJoinWordAds ) {
		return (
			<Notice.Root intent="info">
				<Notice.Description>
					{ __(
						'Only the site owner can join WordAds, which lets you turn on ads and change where they appear.',
						'jetpack-monetize'
					) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<Notice.Root intent={ join.isError ? 'error' : 'info' }>
			<Notice.Description>
				{ join.isError
					? join.error.message ||
						__( 'Your site could not join. Please try again.', 'jetpack-monetize' )
					: __( 'Join WordAds to turn on ads and change where they appear.', 'jetpack-monetize' ) }
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton
					onClick={ onJoin }
					loading={ join.isPending }
					disabled={ join.isPending || Boolean( account?.unsafe ) }
				>
					{ __( 'Join WordAds', 'jetpack-monetize' ) }
				</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
	);
}
