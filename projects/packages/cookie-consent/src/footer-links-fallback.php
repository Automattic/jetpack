<?php
/**
 * Cookie Consent: classic-theme fallback for the required legal links.
 *
 * Rendered on wp_footer by Cookie_Consent::maybe_render_footer_links_fallback()
 * only when the Block Hooks footer-nav injection did not run for this response
 * (classic themes, or block themes whose rendered template has no footer
 * navigation). Provides a fixed-corner floating control holding the Privacy
 * Policy, CCPA opt-out, and "Manage Privacy Preferences" links.
 *
 * The control renders hidden and is revealed client-side only when there is a
 * region-specific required link to show (CCPA opt-out or GDPR manage
 * preferences); see state.showFallbackControl in view.ts. This keeps the server
 * HTML geo-independent (cache-safe) and avoids a persistent global control.
 *
 * Variables provided by the caller:
 *
 * @var string $privacy_policy_url Privacy Policy permalink, or '' when none.
 * @var string $ccpa_url           CCPA opt-out page permalink, or '' when none.
 * @var string $ccpa_label         CCPA opt-out page title (link label), or '' when none.
 *
 * @package automattic/jetpack-cookie-consent
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$privacy_policy_url = isset( $privacy_policy_url ) ? (string) $privacy_policy_url : '';
$ccpa_url           = isset( $ccpa_url ) ? (string) $ccpa_url : '';
// Mirror the Block Hooks footer nav-link, which labels this with the CCPA
// page's own title.
$ccpa_label = isset( $ccpa_label ) ? (string) $ccpa_label : '';
?>

<div
	class="jetpack-cookie-consent-footer-links"
	data-wp-interactive="jetpack/cookie-consent"
	data-wp-context='{"fallbackExpanded": false, "isCcpaRegion": false, "isGdprManageLink": false}'
	data-wp-init="callbacks.init"
	data-wp-on--keydown="actions.onFallbackKeyDown"
	hidden
	data-wp-bind--hidden="!state.showFallbackControl"
>
	<button
		type="button"
		class="jetpack-cookie-consent-footer-links__toggle"
		id="jetpack-cookie-consent-footer-links-toggle"
		aria-haspopup="true"
		aria-expanded="false"
		data-wp-bind--aria-expanded="context.fallbackExpanded"
		aria-controls="jetpack-cookie-consent-footer-links-panel"
		data-wp-on--click="actions.toggleFallbackPanel"
	>
		<span class="jetpack-cookie-consent-footer-links__toggle-icon" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" focusable="false">
				<path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM11.25 7h1.5v1.5h-1.5V7zm0 3h1.5v7h-1.5v-7z"></path>
			</svg>
		</span>
		<span class="jetpack-cookie-consent-footer-links__toggle-text">
			<?php echo esc_html__( 'Privacy', 'jetpack-cookie-consent' ); ?>
		</span>
	</button>

	<div
		class="jetpack-cookie-consent-footer-links__panel"
		id="jetpack-cookie-consent-footer-links-panel"
		role="region"
		aria-label="<?php echo esc_attr__( 'Privacy links', 'jetpack-cookie-consent' ); ?>"
		hidden
		data-wp-bind--hidden="!context.fallbackExpanded"
	>
		<ul class="jetpack-cookie-consent-footer-links__list">
			<?php if ( '' !== $privacy_policy_url ) : ?>
				<li class="jetpack-cookie-consent-footer-links__item">
					<a class="jetpack-cookie-consent-footer-links__link" href="<?php echo esc_url( $privacy_policy_url ); ?>">
						<?php echo esc_html__( 'Privacy Policy', 'jetpack-cookie-consent' ); ?>
					</a>
				</li>
			<?php endif; ?>

			<?php if ( '' !== $ccpa_url ) : ?>
				<li
					class="jetpack-cookie-consent-footer-links__item jetpack-cookie-consent-ccpa-privacy-link-hidden"
					data-wp-class--jetpack-cookie-consent-ccpa-privacy-link-hidden="!state.isCcpaRegion"
				>
					<a class="jetpack-cookie-consent-footer-links__link" href="<?php echo esc_url( $ccpa_url ); ?>">
						<?php echo esc_html( $ccpa_label ); ?>
					</a>
				</li>
			<?php endif; ?>

			<li
				class="jetpack-cookie-consent-footer-links__item jetpack-cookie-consent-gdpr-manage-link-hidden"
				data-wp-class--jetpack-cookie-consent-gdpr-manage-link-hidden="!context.isGdprManageLink"
			>
				<a
					class="jetpack-cookie-consent-footer-links__link"
					href="#manage-preferences"
					data-wp-on--click="actions.openManagePreferences"
				>
					<?php echo esc_html__( 'Manage Privacy Preferences', 'jetpack-cookie-consent' ); ?>
				</a>
			</li>
		</ul>
	</div>
</div>
