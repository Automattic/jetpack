import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Button, ButtonLink, Card, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { getPageData, getSectionState } from '../../data/state';
import { trackAdsEvent } from '../../data/tracking';
import { useAdsAccount, useJoinWordAds } from '../../data/wordads';
import type { UnsafeReason } from '../../data/wordads';

type OpenTab = ( next: string ) => void;

const UNSAFE_MESSAGES: Record< UnsafeReason, () => string > = {
	mature: () =>
		__(
			'Your site has been identified as serving mature content. Advertisers only want family-friendly sites in the program.',
			'jetpack-monetize'
		),
	spam: () =>
		__(
			'Your site has been identified as serving automatically created or copied content, so it can’t show ads.',
			'jetpack-monetize'
		),
	private: () =>
		__(
			'Your site is private. It needs to be public so that visitors can see the ads.',
			'jetpack-monetize'
		),
	other: () => __( 'Your site can’t take part in the ads program.', 'jetpack-monetize' ),
};

const trackUpgradeClick = () => trackAdsEvent( 'upgrade_click' );

/**
 * Why WordPress.com won't serve ads on the site, if it says so.
 *
 * @return The notice, or nothing.
 */
export function UnsafeNotice() {
	const { data: account } = useAdsAccount();

	if ( ! account?.unsafe ) {
		return null;
	}

	return (
		<Notice.Root intent="warning">
			<Notice.Description>{ UNSAFE_MESSAGES[ account.unsafe ]() }</Notice.Description>
			{ account.unsafe === 'mature' && (
				<Notice.Actions>
					<Notice.ActionLink href={ getRedirectUrl( 'wordads-family-safe-sites' ) } openInNewTab>
						{ __( 'Learn more', 'jetpack-monetize' ) }
					</Notice.ActionLink>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}

/**
 * What a plan with ads brings, and the way to it.
 *
 * @return The card.
 */
export function UpsellCard() {
	const { upgradeUrl } = getPageData();

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>
					{ __( 'Upgrade and start earning', 'jetpack-monetize' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md" align="start">
					<Text>
						{ __(
							'Make money each time someone visits your site by displaying ads on all your posts and pages.',
							'jetpack-monetize'
						) }
					</Text>
					{ upgradeUrl && (
						<ButtonLink variant="solid" href={ upgradeUrl } onClick={ trackUpgradeClick }>
							{ __( 'Upgrade', 'jetpack-monetize' ) }
						</ButtonLink>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * The way to start showing ads with a plan that includes them: joining on Simple (owner only), the Settings switch once joined or elsewhere.
 *
 * @param props         - Component props.
 * @param props.openTab - Opens another of the page's tabs.
 * @return The card.
 */
export function StartCard( { openTab }: { openTab: OpenTab } ) {
	const canJoin = Boolean(
		getSectionState< { canJoinWordAds?: boolean } >( 'ads' )?.canJoinWordAds
	);
	const { data: account } = useAdsAccount();
	const join = useJoinWordAds();
	// A Simple site that joined and then switched ads off turns them back on in Settings.
	const mustJoin = isSimpleSite() && ! account?.approved;

	const onSetUp = useCallback( () => {
		trackAdsEvent( 'setup_click' );
		openTab( 'settings' );
	}, [ openTab ] );
	const onJoin = useCallback( () => {
		join.mutate( undefined, { onSuccess: () => trackAdsEvent( 'join' ) } );
	}, [ join ] );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>
					{ mustJoin
						? __( 'Join WordAds', 'jetpack-monetize' )
						: __( 'Start earning from ads', 'jetpack-monetize' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md" align="start">
					<Text>
						{ __(
							'Top ad suppliers bid against each other to show their ads on your site, maximizing your revenue. Your plan lets you start right away, with no review.',
							'jetpack-monetize'
						) }
					</Text>
					{ join.isError && (
						<Notice.Root intent="error">
							<Notice.Description>
								{ join.error.message ||
									__( 'Your site could not join. Please try again.', 'jetpack-monetize' ) }
							</Notice.Description>
						</Notice.Root>
					) }
					{ mustJoin && ! canJoin && (
						<Text>{ __( 'Only the site owner can join WordAds.', 'jetpack-monetize' ) }</Text>
					) }
					{ mustJoin && canJoin && (
						<Button
							variant="solid"
							onClick={ onJoin }
							loading={ join.isPending }
							disabled={ join.isPending || ! account || Boolean( account.unsafe ) }
						>
							{ __( 'Join WordAds', 'jetpack-monetize' ) }
						</Button>
					) }
					{ ! mustJoin && (
						<Button variant="solid" onClick={ onSetUp }>
							{ __( 'Turn on ads', 'jetpack-monetize' ) }
						</Button>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
