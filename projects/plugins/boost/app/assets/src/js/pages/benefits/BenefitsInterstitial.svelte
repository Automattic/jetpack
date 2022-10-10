<script>
	import { PricingCard } from '@automattic/jetpack-components';
	import React from 'react';
	import { derived } from 'svelte/store';
	import { createInterpolateElement } from '@wordpress/element';
	import { __ } from '@wordpress/i18n';
	import { recordBoostEvent } from '../../../js/utils/analytics';
	import BackButton from '../../elements/BackButton.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import config from '../../stores/config';
	import Logo from '../../svg/jetpack-green.svg';
	import { jetpackURL } from '../../utils/jetpack-url';
	import { getUpgradeURL } from '../../utils/upgrade';

	function goToCheckout() {
		recordBoostEvent( 'upsell_from_settings_page' );
		window.location.href = getUpgradeURL();
	}

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let location, navigate;

	const infoText = createInterpolateElement(
		__(
			`By clicking the button above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareLink>share details</shareLink> with WordPress.com.`,
			'jetpack-boost'
		),
		{
			tosLink: React.createElement( 'a', {
				href: jetpackURL( 'https://jetpack.com/redirect/?source=wpcom-tos' ),
				target: '_blank',
			} ),
			shareLink: React.createElement( 'a', {
				href: jetpackURL(
					'https://jetpack.com/redirect/?source=jetpack-support-what-data-does-jetpack-sync'
				),
				target: '_blank',
			} ),
		}
	);

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
					<ReactComponent
						this={PricingCard}
						title={'Jetpack Boost'}
						icon={`${ window.Jetpack_Boost.site.assetPath }../static/images/forward.svg`}
						priceBefore={$pricing.yearly.priceBefore / 12}
						priceAfter={$pricing.yearly.priceAfter / 12}
						priceDetails={__( '/month, paid yearly', 'jetpack-boost' )}
						currencyCode={$pricing.yearly.currencyCode}
						ctaText={__( 'Upgrade Jetpack Boost', 'jetpack-boost' )}
						onCtaClick={goToCheckout}
						{infoText}
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
