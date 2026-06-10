<?php
/**
 * Cookie Consent Banner Template
 *
 * @package woocommerce-next
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<div
	data-wp-interactive="cookie-consent"
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
	class="wc-cookie-consent"
>
	<!-- Banner -->
	<div
		class="wc-cookie-consent__banner"
		data-wp-class--wc-cookie-consent__banner--visible="state.showBanner"
		role="dialog"
		aria-labelledby="cookie-consent-title"
		aria-describedby="cookie-consent-description"
	>
		<div class="wc-cookie-consent__banner-inner">

			<div class="wc-cookie-consent__banner-content">
				<h2 id="cookie-consent-title" class="wc-cookie-consent__banner-title">
					<?php echo esc_html__( 'Use of your personal data', 'ciab' ); ?>
				</h2>
				<p id="cookie-consent-description" class="wc-cookie-consent__banner-description">
					<?php
					echo esc_html__(
						'We and our partners process your personal data (such as browsing data, IP Addresses, cookie information, and other unique identifiers) based on your consent and/or our legitimate interest to optimize our website, marketing activities, and your user experience.',
						'ciab'
					);
					?>
				</p>
			</div>
			<div class="wc-cookie-consent__banner-actions">
				<button
					type="button"
					class="wc-block-components-button wp-element-button wc-cookie-consent__button wc-cookie-consent__button--primary"
					data-wp-on--click="actions.acceptAll"
				>
					<?php echo esc_html__( 'Accept', 'ciab' ); ?>
				</button>
				<button
					type="button"
					class="wc-block-components-button wp-element-button wc-cookie-consent__button wc-cookie-consent__button--primary"
					data-wp-on--click="actions.rejectAll"
				>
					<?php echo esc_html__( 'Reject', 'ciab' ); ?>
				</button>
				<button
					type="button"
					class="wc-cookie-consent__button wc-cookie-consent__button--secondary"
					data-wp-on--click="actions.openModal"
				>
					<?php echo esc_html__( 'Customize', 'ciab' ); ?>
				</button>
			</div>
		</div>
	</div>

	<!-- Modal Overlay-->
	<div
		class="wc-cookie-consent__modal-overlay"
		data-wp-bind--hidden="!state.showModal"
		data-wp-on--click="actions.closeModal"
		role="presentation"
	></div>
	<div
		class="wc-cookie-consent__modal"
		data-wp-bind--hidden="!state.showModal"
		data-wp-class--wc-cookie-consent__modal--visible="state.showModal"
		data-wp-on--keydown="actions.onModalKeyDown"
		role="dialog"
		aria-labelledby="cookie-consent-modal-title"
		aria-modal="true"
	>
		<div class="wc-cookie-consent__modal-header">
			<h3 id="cookie-consent-modal-title" class="wc-cookie-consent__modal-title">
				<?php echo esc_html__( 'Customize preferences', 'ciab' ); ?>
			</h3>
			<button
				type="button"
				class="wc-cookie-consent__modal-close"
				data-wp-on--click="actions.closeModal"
				aria-label="<?php echo esc_attr__( 'Close modal', 'ciab' ); ?>"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
					<path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path>
				</svg>
			</button>
		</div>
		<div class="wc-cookie-consent__modal-content">
			<div class="wc-cookie-consent__modal-body">
				<p class="wc-cookie-consent__modal-description">
					<?php
					echo esc_html__(
						'Your privacy is critically important to us. We and our partners use, store, and process your personal data to optimize our website such as by improving security or conducting analytics, marketing activities to help deliver relevant marketing or content, and your user experience such as by remembering your account name, language settings, or cart information, where applicable. You can customize your cookie settings below. Learn more in our',
						'ciab'
					);
					?>
					<a href="<?php echo esc_url( get_privacy_policy_url() ); ?>" class="wc-cookie-consent__link">
						<?php echo esc_html__( 'Privacy Policy', 'ciab' ); ?>
					</a>
					<?php echo esc_html__( 'and', 'ciab' ); ?>
					<a href="<?php echo esc_url( $config['cookie_policy_url'] ); ?>" class="wc-cookie-consent__link">
						<?php echo esc_html__( 'Cookie Policy', 'ciab' ); ?>
					</a>.
				</p>

				<div class="wc-cookie-consent__category-controls">
					<button
						type="button"
						class="wc-cookie-consent__description-toggle"
						data-wp-class--wc-cookie-consent__description-toggle--expanded="context.textExpanded"
						data-wp-on--click="actions.toggleDescription"
						aria-label="<?php echo esc_attr__( 'Toggle category description', 'ciab' ); ?>"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
							<path d="M18 12.5319L12.5 16.9319L7 12.5319L7.9 11.3319L12.5 14.9319L17 11.3319L18 12.5319Z" fill="#1E1E1E"/>
						</svg>
					</button>

					<!-- Required Cookies -->
					<div class="wc-cookie-consent__category">
						<div class="wc-cookie-consent__category-header">
							<div class="wc-cookie-consent__category-checkbox wc-cookie-consent__category-checkbox--disabled">
								<input
									type="checkbox"
									id="cookie-required"
									checked
									disabled
								/>
								<label for="cookie-required">
									<span class="wc-cookie-consent__category-checkbox-icon"></span>
									<span class="wc-cookie-consent__category-label-text">
										<?php echo esc_html__( 'Required', 'ciab' ); ?>
										<span class="wc-cookie-consent__category-badge">
											<?php echo esc_html__( 'Always active', 'ciab' ); ?>
										</span>
									</span>
								</label>
							</div>
						</div>
						<div class="wc-cookie-consent__category-content">
							<p data-wp-bind--hidden="context.textExpanded" class="wc-cookie-consent__category-text">
								<?php
								echo esc_html(
									wp_trim_words(
										__(
											'These cookies are essential for our websites and services to perform basic functions and are necessary for us to operate certain features. Examples include your IP address, browser type, requested URLs, response codes, and operating system data.',
											'ciab'
										),
										25
									)
								);
								?>
							</p>
							<p data-wp-bind--hidden="!context.textExpanded" class="wc-cookie-consent__category-text">
								<?php
								echo esc_html__(
									'These cookies are essential for our websites and services to perform basic functions and are necessary for us to operate certain features. Examples include your IP address, browser type, requested URLs, response codes, and operating system data.',
									'ciab'
								);
								?>
							</p>
						</div>
					</div>

					<!-- Analytics Cookies -->
					<div class="wc-cookie-consent__category">
						<div class="wc-cookie-consent__category-header">
							<div class="wc-cookie-consent__category-checkbox">
								<input
									type="checkbox"
									id="cookie-analytics"
									data-wp-bind--checked="context.categories.analytics"
									data-wp-on--change="actions.toggleAnalytics"
								/>
								<label for="cookie-analytics">
									<span class="wc-cookie-consent__category-checkbox-icon"></span>
									<span class="wc-cookie-consent__category-label-text">
										<?php echo esc_html__( 'Analytics', 'ciab' ); ?>
									</span>
								</label>
							</div>
						</div>
						<div class="wc-cookie-consent__category-content">
							<p class="wc-cookie-consent__category-text">
								<?php
								echo esc_html__(
									'These cookies allow us to optimize performance by collecting information on how users interact with our websites.',
									'ciab'
								);
								?>
							</p>
						</div>
					</div>

					<!-- Advertising Cookies -->
					<div class="wc-cookie-consent__category">
						<div class="wc-cookie-consent__category-header">
							<div class="wc-cookie-consent__category-checkbox">
								<input
									type="checkbox"
									id="cookie-advertising"
									data-wp-bind--checked="context.categories.advertising"
									data-wp-on--change="actions.toggleAdvertising"
								/>
								<label for="cookie-advertising">
									<span class="wc-cookie-consent__category-checkbox-icon"></span>
									<span class="wc-cookie-consent__category-label-text">
										<?php echo esc_html__( 'Advertising', 'ciab' ); ?>
									</span>
								</label>
							</div>
						</div>
						<div class="wc-cookie-consent__category-content">
							<p class="wc-cookie-consent__category-text">
								<?php
								echo esc_html__(
									'These cookies are set by us and our advertising partners to provide you with relevant content and to understand that content\'s effectiveness.',
									'ciab'
								);
								?>
							</p>
						</div>
					</div>
				</div>
			</div>
			<div class="wc-cookie-consent__modal-footer">
				<button
					type="button"
					class="wc-block-components-button wp-element-button wc-cookie-consent__button wc-cookie-consent__button--primary"
					data-wp-on--click="actions.savePreferences"
				>
					<?php echo esc_html__( 'Save preferences', 'ciab' ); ?>
				</button>
				<button
					type="button"
					class="wc-cookie-consent__button wc-cookie-consent__button--secondary"
					data-wp-on--click="actions.acceptAll"
				>
					<?php echo esc_html__( 'Accept all', 'ciab' ); ?>
				</button>
				<button
					type="button"
					class="wc-cookie-consent__button wc-cookie-consent__button--secondary"
					data-wp-on--click="actions.rejectAll"
				>
					<?php echo esc_html__( 'Reject all', 'ciab' ); ?>
				</button>
			</div>
		</div>
	</div>
</div>
