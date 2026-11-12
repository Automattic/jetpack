import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { isWoASite } from '@automattic/jetpack-script-data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Fieldset, Link, Notice, Spinner, Stack, SwitchControl, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { getAdsSettingsData } from '../../data/ads-settings-data';
import { getTabHref } from '../../data/tabs';
import { trackClick } from '../../data/tracking';
import { useAdsSettings } from '../../data/use-ads-settings';
import { useHasWordAds } from '../../data/use-has-wordads';
import { usePayout, useSavePayout, useWpcomAdsSync } from '../../data/use-wpcom-ads-settings';
import useWpcomConnection from '../../data/use-wpcom-connection';
import ConnectionGate from '../connection-gate';
import { LearnMore, OptionSwitch } from './option-switch';
import { PayoutCard } from './payout-card';
import { AdsPrompt } from './prompt';
import { TextOption } from './text-option';
import type { Help } from './option-switch';
import type { AdsSettingsData } from '../../data/ads-settings-data';
import type { TabValue } from '../../data/tabs';
import type { AdsOption } from '../../data/use-ads-settings';
import type { MouseEvent } from 'react';

type OpenTab = ( tab: TabValue ) => void;

const trackTermsClick = () => trackClick( 'place_ad_widget' );
const trackEarningsClick = () => trackClick( 'view-earnings' );

/**
 * The Ads switch and options, saved as they change.
 *
 * @param props         - Component props.
 * @param props.data    - The Settings tab's server data.
 * @param props.openTab - Opens another of the page's tabs.
 * @return The options.
 */
function AdsOptions( { data, openTab }: { data: AdsSettingsData; openTab: OpenTab } ) {
	const { canUseWpcom } = useWpcomConnection();
	const requestSync = useWpcomAdsSync( canUseWpcom );
	const { values, loadError, saveError, saving, setOption, setModuleActive } =
		useAdsSettings( requestSync );
	const payout = usePayout( canUseWpcom );
	const acceptTerms = useSavePayout();

	const tosSigned = payout.data?.tosSigned;
	const { mutateAsync: signTerms } = acceptTerms;
	const onAdsToggle = useCallback(
		async ( active: boolean ) => {
			// Turning ads on agrees to the terms, so WordPress.com records that first.
			if ( active && canUseWpcom && ! tosSigned ) {
				try {
					await signTerms( { tos: true } );
				} catch {
					return;
				}
			}
			await setModuleActive( active );
		},
		[ canUseWpcom, tosSigned, signTerms, setModuleActive ]
	);

	const openEarnings = useCallback(
		( event: MouseEvent ) => {
			trackEarningsClick();
			// Let modified clicks open the tab's URL in a new browser tab.
			if (
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			) {
				return;
			}
			event.preventDefault();
			openTab( 'ads' );
		},
		[ openTab ]
	);

	if ( loadError ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __( 'The Ads settings could not be loaded.', 'jetpack-monetize' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	if ( ! values ) {
		return <Loading />;
	}

	const isActive = values.wordads;
	const optionsDisabled = ! isActive || saving.has( 'wordads' );

	const toggle = ( name: AdsOption, label: string, help?: Help ) => (
		<OptionSwitch
			name={ name }
			label={ label }
			help={ help }
			checked={ Boolean( values[ name ] ) }
			disabled={ optionsDisabled || saving.has( name ) }
			onChange={ setOption }
		/>
	);

	const text = ( name: AdsOption ) => ( {
		name,
		value: String( values[ name ] ),
		disabled: optionsDisabled,
		isSaving: saving.has( name ),
		onSave: setOption,
	} );

	return (
		<Stack direction="column" gap="lg">
			{ saveError && (
				<Notice.Root intent="error">
					<Notice.Description>
						{ __( 'Failed to save the setting.', 'jetpack-monetize' ) }
					</Notice.Description>
				</Notice.Root>
			) }

			<Card.Root>
				<Card.Content>
					<Stack direction="column" gap="lg">
						<Text>
							{ __(
								'Show ads on the first article on your home page or at the end of every page and post. Place additional ads at the top of your site and to any widget area to increase your earnings.',
								'jetpack-monetize'
							) }
						</Text>
						<Text variant="body-sm">
							{ createInterpolateElement(
								__(
									'By activating ads, you agree to the Automattic Ads <link>Terms of Service</link>, to post only <family>family-friendly content</family>, and not to purchase non-human traffic.',
									'jetpack-monetize'
								),
								{
									link: (
										<Link
											href={ getRedirectUrl( 'wpcom-automattic-ads-tos' ) }
											openInNewTab
											onClick={ trackTermsClick }
										/>
									),
									family: (
										<Link href={ getRedirectUrl( 'wordads-family-safe-sites' ) } openInNewTab />
									),
								}
							) }
						</Text>
						<SwitchControl
							label={ __( 'Enable ads and display an ad below each post', 'jetpack-monetize' ) }
							description={ __(
								'Displays high-quality ads on your site that allow you to earn income.',
								'jetpack-monetize'
							) }
							details={ <LearnMore href={ getRedirectUrl( 'jetpack-support-ads' ) } /> }
							checked={ isActive }
							disabled={
								saving.has( 'wordads' ) || acceptTerms.isPending || Boolean( data.moduleOverride )
							}
							onCheckedChange={ onAdsToggle }
						/>
						{ acceptTerms.isError && (
							<Notice.Root intent="error">
								<Notice.Description>
									{ __(
										'Ads could not be turned on because your agreement to the Terms of Service could not be saved. Please try again.',
										'jetpack-monetize'
									) }
								</Notice.Description>
							</Notice.Root>
						) }
						{ data.moduleOverride && (
							<Notice.Root intent="info">
								<Notice.Description>
									{ data.moduleOverride === 'active'
										? __( 'Enabled by your host or site administrator', 'jetpack-monetize' )
										: __( 'Disabled by your host or site administrator', 'jetpack-monetize' ) }
								</Notice.Description>
							</Notice.Root>
						) }
						<Fieldset.Root>
							<Fieldset.Legend>
								{ __( 'Display ads below posts on', 'jetpack-monetize' ) }
							</Fieldset.Legend>
							<Stack direction="column" gap="sm">
								{ toggle( 'wordads_display_front_page', __( 'Front page', 'jetpack-monetize' ) ) }
								{ toggle( 'wordads_display_post', __( 'Posts', 'jetpack-monetize' ) ) }
								{ toggle( 'wordads_display_page', __( 'Pages', 'jetpack-monetize' ) ) }
								{ toggle( 'wordads_display_archive', __( 'Archives', 'jetpack-monetize' ) ) }
							</Stack>
						</Fieldset.Root>
						<Fieldset.Root>
							<Fieldset.Legend>
								{ __( 'Additional ad placements', 'jetpack-monetize' ) }
							</Fieldset.Legend>
							<Stack direction="column" gap="sm">
								{ toggle( 'enable_header_ad', __( 'Top of each page', 'jetpack-monetize' ) ) }
								{ toggle(
									'wordads_second_belowpost',
									__( 'Second ad below post', 'jetpack-monetize' )
								) }
								{ toggle(
									'wordads_inline_enabled',
									__( 'Inline within post content', 'jetpack-monetize' )
								) }
							</Stack>
						</Fieldset.Root>
						{ isActive && (
							<Link href={ getTabHref( 'ads' ) } onClick={ openEarnings }>
								{ __( 'View your earnings', 'jetpack-monetize' ) }
							</Link>
						) }
					</Stack>
				</Card.Content>
			</Card.Root>

			<ConnectionGate>
				<PayoutCard adsActive={ isActive } />
			</ConnectionGate>

			<Card.Root>
				<Card.Content>
					<Stack direction="column" gap="lg">
						{ toggle(
							'wordads_ccpa_enabled',
							__(
								'Enable targeted advertising to site visitors in all US states.',
								'jetpack-monetize'
							),
							{
								text: __(
									'Enables a targeted advertising opt-out link in US states where this is legally required.',
									'jetpack-monetize'
								),
								href: getRedirectUrl(
									isWoASite() ? 'wpcom-support-us-privacy' : 'jetpack-support-ads'
								),
							}
						) }
						{ values.wordads_ccpa_enabled && (
							<>
								<Text variant="body-sm">
									{ __(
										'Some US states have laws that require offering site visitors an opt-out from having their data used to personalize ads. Targeted advertising is off in certain states unless you enable it.',
										'jetpack-monetize'
									) }
								</Text>
								<Fieldset.Root>
									<Fieldset.Legend>
										{ __( 'Do Not Sell Link', 'jetpack-monetize' ) }
									</Fieldset.Legend>
									<Text>
										{ createInterpolateElement(
											__(
												'If you enable targeted advertising in all US states, you are required to place a "Do Not Sell or Share My Personal Information" link on every page of your site where targeted advertising will appear. You can use the <widgetLink>Do Not Sell Link Widget</widgetLink>, or the <code>[privacy-do-not-sell-link]</code> shortcode to automatically place this link on your site. Note: the link will always display to logged in administrators regardless of geolocation.',
												'jetpack-monetize'
											),
											{
												code: <code />,
												widgetLink: <Link href="customize.php?autofocus[panel]=widgets" />,
											}
										) }
									</Text>
									<Text variant="body-sm">
										{ __(
											'Failure to add this link will result in non-compliance with privacy laws in some US states.',
											'jetpack-monetize'
										) }
									</Text>
								</Fieldset.Root>
								<TextOption
									{ ...text( 'wordads_ccpa_privacy_policy_url' ) }
									label={ __( 'Privacy Policy URL', 'jetpack-monetize' ) }
									placeholder="https://"
									description={ __(
										'Adds a link to your privacy policy to the notice popup triggered by the do not sell link (optional).',
										'jetpack-monetize'
									) }
								/>
							</>
						) }
					</Stack>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content>
					{ toggle( 'wordads_cmp_enabled', __( 'Enable GDPR Consent Banner', 'jetpack-monetize' ), {
						text: __(
							'Show a cookie banner to all EU and UK site visitors prompting them to consent to their personal data being used to personalize the ads they see. Without proper consents EU/UK visitors will only see lower paying non-personalized ads.',
							'jetpack-monetize'
						),
						href: getRedirectUrl( 'jetpack-support-ads' ),
					} ) }
				</Card.Content>
			</Card.Root>

			{ ! data.isSubdirectorySite && (
				<Card.Root>
					<Card.Content>
						<Stack direction="column" gap="lg">
							{ toggle(
								'wordads_custom_adstxt_enabled',
								__( 'Customize your ads.txt file', 'jetpack-monetize' ),
								{
									text: __(
										'Ads.txt (Authorized Digital Sellers) is a mechanism that enables content owners to declare who is authorized to sell their ad inventory. It’s the formal list of advertising partners you support as a publisher.',
										'jetpack-monetize'
									),
									href: 'https://jetpack.com/support/ads/',
								}
							) }
							{ values.wordads_custom_adstxt_enabled && (
								<>
									<Text>
										{ isActive
											? createInterpolateElement(
													__(
														'WordAds automatically generates a custom <link1>ads.txt</link1> tailored for your site. If you need to add additional entries for other networks please add them in the space below, one per line. <link2>Check here for more details</link2>.',
														'jetpack-monetize'
													),
													{
														link1: <Link href="/ads.txt" openInNewTab />,
														link2: (
															<Link
																href={ getRedirectUrl(
																	'jetpack-how-jetpack-ads-members-can-increase-their-earnings-with-ads-txt'
																) }
																openInNewTab
															/>
														),
													}
												)
											: __(
													'When ads are enabled, Jetpack automatically generates a custom ads.txt tailored for your site.',
													'jetpack-monetize'
												) }
									</Text>
									<TextOption
										{ ...text( 'wordads_custom_adstxt' ) }
										label={ __( 'Additional ads.txt entries', 'jetpack-monetize' ) }
										hideLabelFromVision
										multiline
									/>
								</>
							) }
						</Stack>
					</Card.Content>
				</Card.Root>
			) }
		</Stack>
	);
}

/**
 * A spinner centered in the tab while the settings load.
 *
 * @return The spinner.
 */
function Loading() {
	return (
		<Stack direction="row" justify="center" className="jp-monetize-loading">
			<Spinner />
		</Stack>
	);
}

/**
 * The Ads options with a plan that includes WordAds, or the prompt to get one.
 *
 * @param props         - Component props.
 * @param props.data    - The Settings tab's server data.
 * @param props.openTab - Opens another of the page's tabs.
 * @return The options or the prompt.
 */
function AdsCard( { data, openTab }: { data: AdsSettingsData; openTab: OpenTab } ) {
	const hasWordAds = useHasWordAds( data.hasWordAds );

	if ( hasWordAds === undefined ) {
		return <Loading />;
	}

	return hasWordAds ? (
		<AdsOptions data={ data } openTab={ openTab } />
	) : (
		<AdsPrompt data={ data } />
	);
}

/**
 * Monetize › Settings: the Ads settings that left Jetpack › Settings.
 *
 * @param props         - Component props.
 * @param props.openTab - Opens another of the page's tabs.
 * @return The Ads card, or nothing where the Jetpack plugin sent no data for it.
 */
export function AdsSettings( { openTab }: { openTab: OpenTab } ) {
	const data = getAdsSettingsData();

	return data ? <AdsCard data={ data } openTab={ openTab } /> : null;
}
