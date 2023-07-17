<script lang="ts">
	import { PricingCard } from '@automattic/jetpack-components';
	import { derived } from 'svelte/store';
	import { __ } from '@wordpress/i18n';
	import ActivateLicense from '../../elements/ActivateLicense.svelte';
	import BackButton from '../../elements/BackButton.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import Footer from '../../sections/Footer.svelte';
	import config from '../../stores/config';
	import Logo from '../../svg/jetpack-green.svg';
	import JetpackBoostLogo from '../../svg/logo.svg';
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

<div id="jb-dashboard" class="jb-dashboard">
	<div class="jb-dashboard-header jb-benefits-header">
		<div class="jb-container jb-container--fixed">
			<div class="jb-dashboard-header__logo">
				<JetpackBoostLogo />
			</div>

			<ActivateLicense />
		</div>
	</div>

	<div class="jb-benefits__body">
		<div class="jb-container jb-container--fixed mt-2">
			<BackButton />
			<div class="jb-card">
				<div class="jb-card__content">
					<Logo class="my-2" />
					<h1 class="my-2">{__( "Optimize your website's performance", 'jetpack-boost' )}</h1>
					<p class="jb-card__summary my-2">
						{__(
							'Automatically regenerate critical CSS after site changes, and hunt down image issues with ease.',
							'jetpack-boost'
						)}
					</p>
					<ul class="jb-checklist my-2">
						<li>{__( 'Automatic critical CSS regeneration', 'jetpack-boost' )}</li>
						<li>{__( 'Image Size Analyzer', 'jetpack-boost' )}</li>
						<li>
							{__( 'Performance scores are recalculated after each change', 'jetpack-boost' )}
						</li>
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

	<div class="jb-benefits-footer">
		<Footer />
	</div>
</div>

<style lang="scss">
	.jb-benefits-header {
		padding-block-start: 40px;
		padding-block-end: 40px;
		background-color: var( --jp-white );
		height: unset;

		.jb-dashboard-header__logo {
			max-width: 240px;
			height: unset;
		}

		.jb-container--fixed {
			flex-basis: 100%;

			display: flex;
			align-items: center;
			justify-content: space-between;
			flex-wrap: wrap;
			gap: 24px;
		}
	}

	.jb-benefits__body {
		background-color: var( --jp-white-off );
		padding-block-end: 64px;
	}

	.jb-benefits-footer {
		background-color: var( --jp-white );
	}
</style>
