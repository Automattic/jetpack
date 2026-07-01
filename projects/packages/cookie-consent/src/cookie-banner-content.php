<?php
/**
 * Cookie Consent Banner Template
 *
 * @package automattic/jetpack-cookie-consent
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// $config is supplied by Cookie_Consent::render_banner() when this template is included.
$config              = isset( $config ) && is_array( $config ) ? $config : array();
$copy                = \Automattic\Jetpack\CookieConsent\Cookie_Consent::get_copy( $config );
$categories          = \Automattic\Jetpack\CookieConsent\Cookie_Consent::get_consent_categories( $config );
$category_context    = \Automattic\Jetpack\CookieConsent\Cookie_Consent::get_category_context( $categories );
$banner_context      = array(
	'showBanner'   => false,
	'showModal'    => false,
	'categories'   => $category_context,
	'textExpanded' => false,
);
$banner_context_json = wp_json_encode( $banner_context, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
$links               = isset( $config['links'] ) && is_array( $config['links'] ) ? $config['links'] : array();
$cookie_policy_url   = array_key_exists( 'cookie_policy_url', $links ) && is_scalar( $links['cookie_policy_url'] )
	? trim( (string) $links['cookie_policy_url'] )
	: '';
$privacy_policy_url  = (string) get_privacy_policy_url();
?>

<div
	data-wp-interactive="jetpack/cookie-consent"
	data-wp-context="<?php echo esc_attr( $banner_context_json ); ?>"
	data-wp-init="callbacks.init"
	class="jetpack-cookie-consent"
>
	<!-- Banner -->
	<div
		class="jetpack-cookie-consent__banner"
		data-wp-class--jetpack-cookie-consent__banner--visible="state.showBanner"
		role="dialog"
		aria-labelledby="cookie-consent-title"
		aria-describedby="cookie-consent-description"
	>
		<div class="jetpack-cookie-consent__banner-inner">

			<div class="jetpack-cookie-consent__banner-content">
				<h2 id="cookie-consent-title" class="jetpack-cookie-consent__banner-title">
					<?php echo esc_html( $copy['banner_title'] ); ?>
				</h2>
				<p id="cookie-consent-description" class="jetpack-cookie-consent__banner-description">
					<?php echo esc_html( $copy['banner_description'] ); ?>
				</p>
			</div>
			<div class="jetpack-cookie-consent__banner-actions">
				<button
					type="button"
					class="wp-element-button jetpack-cookie-consent__button jetpack-cookie-consent__button--primary"
					data-wp-on--click="actions.acceptAll"
				>
					<?php echo esc_html( $copy['banner_accept_button'] ); ?>
				</button>
				<button
					type="button"
					class="wp-element-button jetpack-cookie-consent__button jetpack-cookie-consent__button--primary"
					data-wp-on--click="actions.rejectAll"
				>
					<?php echo esc_html( $copy['banner_reject_button'] ); ?>
				</button>
				<button
					type="button"
					class="jetpack-cookie-consent__button jetpack-cookie-consent__button--secondary"
					data-wp-on--click="actions.openModal"
				>
					<?php echo esc_html( $copy['banner_customize_button'] ); ?>
				</button>
			</div>
		</div>
	</div>

	<!-- Modal Overlay-->
	<div
		class="jetpack-cookie-consent__modal-overlay"
		data-wp-bind--hidden="!state.showModal"
		data-wp-on--click="actions.closeModal"
		role="presentation"
	></div>
	<div
		class="jetpack-cookie-consent__modal"
		data-wp-bind--hidden="!state.showModal"
		data-wp-class--jetpack-cookie-consent__modal--visible="state.showModal"
		data-wp-on--keydown="actions.onModalKeyDown"
		role="dialog"
		aria-labelledby="cookie-consent-modal-title"
		aria-modal="true"
	>
		<div class="jetpack-cookie-consent__modal-header">
			<h3 id="cookie-consent-modal-title" class="jetpack-cookie-consent__modal-title">
				<?php echo esc_html( $copy['modal_title'] ); ?>
			</h3>
			<button
				type="button"
				class="jetpack-cookie-consent__modal-close"
				data-wp-on--click="actions.closeModal"
				aria-label="<?php echo esc_attr( $copy['modal_close_label'] ); ?>"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
					<path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path>
				</svg>
			</button>
		</div>
		<div class="jetpack-cookie-consent__modal-content">
			<div class="jetpack-cookie-consent__modal-body">
				<p class="jetpack-cookie-consent__modal-description">
					<?php
					echo esc_html( $copy['modal_description'] );

					// Only link policies that are actually configured, so we never render a
					// dead href="" link (e.g. when the site has no Privacy Policy page set).
					$policy_links = array();
					if ( '' !== $privacy_policy_url ) {
						$policy_links[] = sprintf(
							'<a href="%s" class="jetpack-cookie-consent__link">%s</a>',
							esc_url( $privacy_policy_url ),
							esc_html( $copy['privacy_policy_link'] )
						);
					}
					if ( '' !== $cookie_policy_url ) {
						$policy_links[] = sprintf(
							'<a href="%s" class="jetpack-cookie-consent__link">%s</a>',
							esc_url( $cookie_policy_url ),
							esc_html( $copy['cookie_policy_link'] )
						);
					}
					// Append the "Learn more in our <links>." clause only when at least one
					// policy link exists, so the description never ends with a dangling lead-in.
					if ( $policy_links ) {
						// Each link is already escaped above; join them with the conjunction.
						echo ' ' . esc_html( $copy['modal_links_lead'] ) . ' '
							. wp_kses_post( implode( ' ' . esc_html( $copy['modal_links_conjunction'] ) . ' ', $policy_links ) )
							. '.';
					}
					?>
				</p>

				<div class="jetpack-cookie-consent__category-controls">
					<button
						type="button"
						class="jetpack-cookie-consent__description-toggle"
						data-wp-class--jetpack-cookie-consent__description-toggle--expanded="context.textExpanded"
						data-wp-on--click="actions.toggleDescription"
						aria-label="<?php echo esc_attr( $copy['category_toggle_label'] ); ?>"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
							<path d="M18 12.5319L12.5 16.9319L7 12.5319L7.9 11.3319L12.5 14.9319L17 11.3319L18 12.5319Z" fill="#1E1E1E"/>
						</svg>
					</button>

					<?php foreach ( $categories as $category ) : ?>
						<?php
						$preference_key  = \Automattic\Jetpack\CookieConsent\Cookie_Consent::get_category_preference_key( $category['key'] );
						$input_id        = 'cookie-' . sanitize_html_class( $preference_key );
						$checkbox_class  = 'jetpack-cookie-consent__category-checkbox';
						$checkbox_class .= $category['required'] ? ' jetpack-cookie-consent__category-checkbox--disabled' : '';
						?>
						<div class="jetpack-cookie-consent__category">
							<div class="jetpack-cookie-consent__category-header">
								<div class="<?php echo esc_attr( $checkbox_class ); ?>">
									<input
										type="checkbox"
										id="<?php echo esc_attr( $input_id ); ?>"
										data-consent-category="<?php echo esc_attr( $preference_key ); ?>"
										data-wp-bind--checked="context.categories.<?php echo esc_attr( $preference_key ); ?>"
										<?php if ( ! $category['required'] ) : ?>
											data-wp-on--change="actions.toggleCategory"
										<?php endif; ?>
										<?php checked( $category_context[ $preference_key ] ); ?>
										<?php disabled( $category['required'] ); ?>
									/>
									<label for="<?php echo esc_attr( $input_id ); ?>">
										<span class="jetpack-cookie-consent__category-checkbox-icon"></span>
										<span class="jetpack-cookie-consent__category-label-text">
											<?php echo esc_html( $category['label'] ); ?>
											<?php if ( $category['required'] ) : ?>
												<span class="jetpack-cookie-consent__category-badge">
													<?php echo esc_html( $copy['always_active_label'] ); ?>
												</span>
											<?php endif; ?>
										</span>
									</label>
								</div>
							</div>
							<div class="jetpack-cookie-consent__category-content">
								<?php if ( $category['required'] ) : ?>
									<p data-wp-bind--hidden="context.textExpanded" class="jetpack-cookie-consent__category-text">
										<?php echo esc_html( wp_trim_words( $category['description'], 25 ) ); ?>
									</p>
									<p data-wp-bind--hidden="!context.textExpanded" class="jetpack-cookie-consent__category-text">
										<?php echo esc_html( $category['description'] ); ?>
									</p>
								<?php else : ?>
									<p class="jetpack-cookie-consent__category-text">
										<?php echo esc_html( $category['description'] ); ?>
									</p>
								<?php endif; ?>
							</div>
						</div>
					<?php endforeach; ?>
				</div>
			</div>
			<div class="jetpack-cookie-consent__modal-footer">
				<button
					type="button"
					class="wp-element-button jetpack-cookie-consent__button jetpack-cookie-consent__button--primary"
					data-wp-on--click="actions.savePreferences"
				>
					<?php echo esc_html( $copy['save_preferences_button'] ); ?>
				</button>
				<button
					type="button"
					class="jetpack-cookie-consent__button jetpack-cookie-consent__button--secondary"
					data-wp-on--click="actions.acceptAll"
				>
					<?php echo esc_html( $copy['accept_all_button'] ); ?>
				</button>
				<button
					type="button"
					class="jetpack-cookie-consent__button jetpack-cookie-consent__button--secondary"
					data-wp-on--click="actions.rejectAll"
				>
					<?php echo esc_html( $copy['reject_all_button'] ); ?>
				</button>
			</div>
		</div>
	</div>
</div>
