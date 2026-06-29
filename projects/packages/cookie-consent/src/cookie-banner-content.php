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
$config = isset( $config ) && is_array( $config ) ? $config : array( 'cookie_policy_url' => '' );
$copy   = \Automattic\Jetpack\CookieConsent\Cookie_Consent::get_copy( $config );
?>

<div
	data-wp-interactive="jetpack/cookie-consent"
	data-wp-context='{
		"showBanner": false,
		"showModal": false,
		"categories": {
			"required": true,
			"analytics": true,
			"advertising": false
		},
		"textExpanded": false
	}'
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
					<?php echo esc_html( $copy['modal_description'] ); ?>
					<a href="<?php echo esc_url( get_privacy_policy_url() ); ?>" class="jetpack-cookie-consent__link">
						<?php echo esc_html( $copy['privacy_policy_link'] ); ?>
					</a>
					<?php echo esc_html( $copy['modal_links_conjunction'] ); ?>
					<a href="<?php echo esc_url( $config['cookie_policy_url'] ); ?>" class="jetpack-cookie-consent__link">
						<?php echo esc_html( $copy['cookie_policy_link'] ); ?>
					</a>.
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

					<!-- Required Cookies -->
					<div class="jetpack-cookie-consent__category">
						<div class="jetpack-cookie-consent__category-header">
							<div class="jetpack-cookie-consent__category-checkbox jetpack-cookie-consent__category-checkbox--disabled">
								<input
									type="checkbox"
									id="cookie-required"
									checked
									disabled
								/>
								<label for="cookie-required">
									<span class="jetpack-cookie-consent__category-checkbox-icon"></span>
									<span class="jetpack-cookie-consent__category-label-text">
										<?php echo esc_html( $copy['required_category_label'] ); ?>
										<span class="jetpack-cookie-consent__category-badge">
											<?php echo esc_html( $copy['always_active_label'] ); ?>
										</span>
									</span>
								</label>
							</div>
						</div>
						<div class="jetpack-cookie-consent__category-content">
							<p data-wp-bind--hidden="context.textExpanded" class="jetpack-cookie-consent__category-text">
								<?php
								echo esc_html(
									wp_trim_words(
										$copy['required_category_description'],
										25
									)
								);
								?>
							</p>
							<p data-wp-bind--hidden="!context.textExpanded" class="jetpack-cookie-consent__category-text">
								<?php echo esc_html( $copy['required_category_description'] ); ?>
							</p>
						</div>
					</div>

					<!-- Analytics Cookies -->
					<div class="jetpack-cookie-consent__category">
						<div class="jetpack-cookie-consent__category-header">
							<div class="jetpack-cookie-consent__category-checkbox">
								<input
									type="checkbox"
									id="cookie-analytics"
									data-wp-bind--checked="context.categories.analytics"
									data-wp-on--change="actions.toggleAnalytics"
								/>
								<label for="cookie-analytics">
									<span class="jetpack-cookie-consent__category-checkbox-icon"></span>
									<span class="jetpack-cookie-consent__category-label-text">
										<?php echo esc_html( $copy['analytics_category_label'] ); ?>
									</span>
								</label>
							</div>
						</div>
						<div class="jetpack-cookie-consent__category-content">
							<p class="jetpack-cookie-consent__category-text">
								<?php echo esc_html( $copy['analytics_category_description'] ); ?>
							</p>
						</div>
					</div>

					<!-- Advertising Cookies -->
					<div class="jetpack-cookie-consent__category">
						<div class="jetpack-cookie-consent__category-header">
							<div class="jetpack-cookie-consent__category-checkbox">
								<input
									type="checkbox"
									id="cookie-advertising"
									data-wp-bind--checked="context.categories.advertising"
									data-wp-on--change="actions.toggleAdvertising"
								/>
								<label for="cookie-advertising">
									<span class="jetpack-cookie-consent__category-checkbox-icon"></span>
									<span class="jetpack-cookie-consent__category-label-text">
										<?php echo esc_html( $copy['advertising_category_label'] ); ?>
									</span>
								</label>
							</div>
						</div>
						<div class="jetpack-cookie-consent__category-content">
							<p class="jetpack-cookie-consent__category-text">
								<?php echo esc_html( $copy['advertising_category_description'] ); ?>
							</p>
						</div>
					</div>
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
