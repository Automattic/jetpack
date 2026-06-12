import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { getScriptData, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Link, Notice, Stack, Text } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { getRefreshPlanQuery, getSocialScriptData, hasSocialPaidFeatures } from '../../utils';
import './style.scss';

/**
 * Activation gate for the modernization chassis — shown in place of the
 * Overview/Settings tabs when the Publicize module is off and the current
 * user can switch it on (`canToggleSocialModule()`; see `useSocialGate`).
 *
 * It restores the educational on-ramp the legacy admin page offered when the
 * module was inactive: a "what is Social" hero, the master enable toggle, an
 * upsell nudge (self-hosted/free only), and the "Did you know?" stats. The
 * copy and behaviour are lifted verbatim from the legacy `SocialModuleToggle`
 * and `InfoSection` so this stays in sync with the rest of the product and
 * adds no new translatable strings. Per umbrella decision #48824 the chassis
 * carries no master toggle on the *active* dashboard — this gate only adds an
 * on-ramp, and disappears the moment Publicize is enabled (the gate decision
 * re-runs and falls through to the tabs).
 *
 * @return The activation gate.
 */
export default function ActivationGate(): JSX.Element {
	const isUpdating = useSelect(
		select => select( socialStore ).isSavingSocialModuleSettings(),
		[]
	);

	const { updateSocialModuleSettings } = useDispatch( socialStore );

	const onEnable = useCallback( async () => {
		await updateSocialModuleSettings( { publicize: true } );

		// Connection data is hydrated from page-load script data; when Publicize
		// was off at load there is none to show, so reload to fetch it (mirrors
		// the legacy `SocialModuleToggle` and pricing-gate behaviour).
		if ( ! getSocialScriptData().is_publicize_enabled ) {
			window.location.reload();
		}
	}, [ updateSocialModuleSettings ] );

	const { wpcom, host, suffix: siteSuffix } = getScriptData().site;
	const is_wpcom = host === 'wpcom';
	const showUpsell = ! isWpcomPlatformSite() && ! hasSocialPaidFeatures();

	return (
		<div className="jetpack-social-gate jetpack-social-activation">
			<Card.Root className="jetpack-social-activation__card">
				<Card.Content>
					<Stack direction="column" gap="lg">
						<div className="jetpack-social-activation__hero">
							<h2 className="jetpack-social-gate__title">
								{ __( 'Write once, post everywhere', 'jetpack-publicize-pkg' ) }
							</h2>
							<p className="jetpack-social-gate__subtitle">
								{ __(
									'Share your posts with your social media network and increase your site’s traffic.',
									'jetpack-publicize-pkg'
								) }
							</p>
						</div>

						<ToggleControl
							__nextHasNoMarginBottom
							className="jetpack-social-activation__toggle"
							label={ __(
								'Automatically share your posts to social networks',
								'jetpack-publicize-pkg'
							) }
							checked={ false }
							disabled={ isUpdating }
							onChange={ onEnable }
							help={
								<Text variant="body-sm">
									{ __(
										'When enabled, you’ll be able to connect your social media accounts and send a post’s featured image and content to the selected channels with a single click when the post is published.',
										'jetpack-publicize-pkg'
									) }
									&nbsp;
									<Link
										openInNewTab
										href={
											is_wpcom
												? getRedirectUrl( 'wpcom-social-plugin-publicize-support-admin-page' )
												: getRedirectUrl( 'social-plugin-publicize-support-admin-page' )
										}
									>
										{ __( 'Learn more', 'jetpack-publicize-pkg' ) }
									</Link>
								</Text>
							}
						/>

						{ showUpsell && (
							<Notice.Root intent="info">
								<Notice.Description>
									{ __( 'Unlock advanced sharing options', 'jetpack-publicize-pkg' ) }
								</Notice.Description>
								<Notice.Actions>
									<Notice.ActionLink
										href={ getRedirectUrl( 'jetpack-social-admin-page-upsell', {
											site: `${ wpcom.blog_id ?? siteSuffix }`,
											query: getRefreshPlanQuery(),
										} ) }
									>
										{ __( 'Power up Jetpack Social', 'jetpack-publicize-pkg' ) }
									</Notice.ActionLink>
								</Notice.Actions>
							</Notice.Root>
						) }

						<div className="jetpack-social-activation__stats">
							<h3 className="jetpack-social-activation__stats-title">
								{ __( 'Did you know?', 'jetpack-publicize-pkg' ) }
							</h3>
							<div className="jetpack-social-activation__stat">
								<span className="jetpack-social-activation__stat-number">40x</span>
								<p>
									{ __(
										'Visual content is 40 times more likely to get shared on social media than any other type. Remember to include an image.',
										'jetpack-publicize-pkg'
									) }
								</p>
							</div>
							<div className="jetpack-social-activation__stat">
								<span className="jetpack-social-activation__stat-number">10x</span>
								<p>
									{ __(
										'By publishing at least once per week, you’ll be ahead of 99% of all other sites. Promoting that weekly content on social media may grow your audience by 10x in a few short months.',
										'jetpack-publicize-pkg'
									) }
								</p>
							</div>
						</div>
					</Stack>
				</Card.Content>
			</Card.Root>
		</div>
	);
}
