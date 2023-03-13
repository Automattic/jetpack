<script lang="ts">
	import { PricingCard } from '@automattic/jetpack-components';
	import { derived } from 'svelte/store';
	import { __ } from '@wordpress/i18n';
	import BackButton from '../../elements/BackButton.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import config from '../../stores/config';
	import Logo from '../../svg/jetpack-green.svg';
	import { recordBoostEvent } from '../../utils/analytics';
	import { getUpgradeURL } from '../../utils/upgrade';

	async function goToCheckout() {
		const eventProps = {};
		await recordBoostEvent( 'checkout_from_pricing_page_in_plugin', eventProps );
		window.location.href = getUpgradeURL();
	}

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let location, navigate;

	const ctaText = __( 'Upgrade Jetpack Boost', 'jetpack-boost' );

	const pricing = derived( config, $config => $config.pricing );

	if ( ! ( 'yearly' in $pricing ) ) {
		goToCheckout();
	}
</script>

<div id="jb-settings" class="jb-settings">
		<div class="jb-container jb-container--fixed mt-2">
			<BackButton />
			<div class="jb-card">
				<div class="jb-card__content">
					<Logo class="my-2" />
					<h1 class="my-2">{__( "Optimize your website's performance", 'jetpack-boost' )}</h1>
					<p class="jb-card__summary my-2">
						{__(
							'Remove the need to manually regenerate critical CSS after site changes with automated critical CSS.',
							'jetpack-boost'
						)}
					</p>
					<ul class="jb-checklist my-2">
						<li>{__( 'Automatic critical CSS regeneration', 'jetpack-boost' )}</li>
						<li>{__( 'Performance scores are recalculated after each change', 'jetpack-boost' )}</li>
						<li>{__( 'Dedicated email support', 'jetpack-boost' )}</li>
					</ul>
				</div>

				<div class="jb-card__cta px-2 my-4">
					{#if 'yearly' in $pricing}
						<!-- svelte-ignore missing-declaration Jetpack_Boost -->
						<ReactComponent
							this={PricingCard}
							title={__( 'Jetpack Boost', 'jetpack-boost' )}
							icon={`${ Jetpack_Boost.site.assetPath }../static/images/forward.svg`}
							priceBefore={$pricing.yearly.priceBefore / 12}
							priceAfter={$pricing.yearly.priceAfter / 12}
							priceDetails={__( '/month, paid yearly', 'jetpack-boost' )}
							currencyCode={$pricing.yearly.currencyCode}
							{ctaText}
							onCtaClick={goToCheckout}
						/>
					{/if}
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
