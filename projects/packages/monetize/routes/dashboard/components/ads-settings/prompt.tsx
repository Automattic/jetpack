import { CONNECTION_FROM } from '@automattic/jetpack-connection/connection-from';
import { getUserConnectionUrl } from '@automattic/jetpack-connection/get-user-connection-url';
import { __, _x } from '@wordpress/i18n';
import { Button, ButtonLink, Notice, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { showSuccessSnackbar } from '../../data/notices';
import { getSectionState } from '../../data/state';
import { trackAdsEvent, trackBannerClick } from '../../data/tracking';
import { useAdsAccount, useJoinWordAds } from '../../data/wordads';
import { PromptCard, START_TEXT, UpsellCard } from '../ads/status';
import type { AdsSettingsData } from '../../data/ads-settings-data';

const trackConnectClick = () => trackBannerClick( 'connect' );
const trackUpgradeClick = () => trackBannerClick( 'upgrade' );

/**
 * What Settings shows instead of the Ads options without a WordAds plan, matching the Ads tab.
 *
 * @param props      - Component props.
 * @param props.data - The Settings tab's server data.
 * @return The upgrade card, or the connect card without a connected owner.
 */
export function AdsPrompt( { data }: { data: AdsSettingsData } ) {
	if ( data.hasConnectedOwner ) {
		return <UpsellCard onUpgradeClick={ trackUpgradeClick } />;
	}

	return (
		<PromptCard title={ __( 'Upgrade and start earning', 'jetpack-monetize' ) }>
			<Text>
				{ __(
					'Connect your WordPress.com account to upgrade and generate income with high-quality ads.',
					'jetpack-monetize'
				) }
			</Text>
			<ButtonLink
				variant="solid"
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
			</ButtonLink>
		</PromptCard>
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
	const canJoin = Boolean(
		getSectionState< { canJoinWordAds?: boolean } >( 'ads' )?.canJoinWordAds
	);

	return (
		<PromptCard title={ __( 'Join WordAds', 'jetpack-monetize' ) }>
			<Text>{ START_TEXT() }</Text>
			{ join.isError && (
				<Notice.Root intent="error">
					<Notice.Description>
						{ join.error.message ||
							__( 'Your site could not join. Please try again.', 'jetpack-monetize' ) }
					</Notice.Description>
				</Notice.Root>
			) }
			{ canJoin ? (
				<Button
					variant="solid"
					onClick={ onJoin }
					loading={ join.isPending }
					disabled={ join.isPending || Boolean( account?.unsafe ) }
				>
					{ __( 'Join WordAds', 'jetpack-monetize' ) }
				</Button>
			) : (
				<Text>{ __( 'Only the site owner can join WordAds.', 'jetpack-monetize' ) }</Text>
			) }
		</PromptCard>
	);
}
