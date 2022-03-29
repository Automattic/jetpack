<script>
	/**
	 * Internal dependencies
	 */
	import BackButton from '../../elements/BackButton.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';

	import Logo from '../../svg/jetpack-green.svg';

	/**
	 * External dependencies
	 */
	import { PricingCard } from '@automattic/jetpack-components';

	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';

	function onCtaClick() {
		/* eslint-disable no-console */
		console.log( 'CTA clicked' );
	}

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let location, navigate;
</script>

<div id="jb-settings" class="jb-settings">
	<div class="jb-container jb-container--fixed mt-3">
		<BackButton />
		<div class="jb-card">
			<div class="jb-card__content">
				<Logo class="my-3" />
				<h1 class="my-3">{__( "Optimize your website's performance", 'jetpack-boost' )}</h1>
				<p class="jb-card__summary my-3">
					{__(
						'Remove the need to manually regenerate critical CSS after site changes with automated critical CSS.',
						'jetpack-boost'
					)}
				</p>
				<ul class="jb-checklist">
					<li>{__( 'Automatic critical CSS regeneration', 'jetpack-boost' )}</li>
					<li>{__( 'Performance scores are recalculated after each change', 'jetpack-boost' )}</li>
					<li>{__( 'Dedicated email support', 'jetpack-boost' )}</li>
				</ul>

				<div class="jb-card__cta mb-3">
					<ReactComponent
						this={PricingCard}
						title={'Jetpack Boost'}
						icon={`${ window.Jetpack_Boost.site.assetPath }../static/images/forward.svg`}
						priceBefore={19.95}
						priceAfter={9.95}
						priceDetails={__( '/month, paid yearly', 'jetpack-boost' )}
						currencyCode={'USD'}
						ctaText={__( 'Upgrade Jetpack Boost', 'jetpack-boost' )}
						{onCtaClick}
						infoText={__(
							'By clicking the button above, you agree to our Terms of Service and to share details with WordPress.com',
							'jetpack-boost'
						)}
					/>
				</div>
			</div>
		</div>
		<footer class="jb-footer-note">
			{__(
				'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
				'jetpack-boost'
			)}
		</footer>
	</div>
</div>
