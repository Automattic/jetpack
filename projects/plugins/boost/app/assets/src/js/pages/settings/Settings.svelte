<script>
	/**
	 * External dependencies
	 */
	import { derived } from 'svelte/store';

	/**
	 * Internal dependencies
	 */
	import Tips from './sections/Tips.svelte';
	import Score from './sections/Score.svelte';
	import urlFragment from '../../stores/url-fragment';
	import AdvancedCriticalCss from './sections/AdvancedCriticalCss.svelte';
	import Modules from './sections/Modules.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import { PricingCard } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';

	// Map of sub-pages to display for each URL fragment.
	const subPages = {
		'#critical-css-advanced': AdvancedCriticalCss,
	};

	function onCtaClick() {
		/* eslint-disable no-console */
		console.log( 'CTA clicked' );
	}

	const subPage = derived( urlFragment, fragment => subPages[ fragment ] );
</script>

<div>
	<h1>Here is a demo Jetpack React component:</h1>

	<div style="margin: 20px">
		<ReactComponent
			this={PricingCard}
			title={'Jetpack Premium'}
			icon={"data:image/svg+xml,%3Csvg width='32' height='32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m21.092 15.164.019-1.703v-.039c0-1.975-1.803-3.866-4.4-3.866-2.17 0-3.828 1.351-4.274 2.943l-.426 1.524-1.581-.065a2.92 2.92 0 0 0-.12-.002c-1.586 0-2.977 1.344-2.977 3.133 0 1.787 1.388 3.13 2.973 3.133H22.399c1.194 0 2.267-1.016 2.267-2.4 0-1.235-.865-2.19-1.897-2.368l-1.677-.29Zm-10.58-3.204a4.944 4.944 0 0 0-.201-.004c-2.75 0-4.978 2.298-4.978 5.133s2.229 5.133 4.978 5.133h12.088c2.357 0 4.267-1.97 4.267-4.4 0-2.18-1.538-3.99-3.556-4.339v-.06c0-3.24-2.865-5.867-6.4-5.867-2.983 0-5.49 1.871-6.199 4.404Z' fill='%23000'/%3E%3C/svg%3E"}
			priceBefore={19.95}
			priceAfter={9.95}
			priceDetails={__( 'for the first year', 'jetpack-boost' )}
			currencyCode={'USD'}
			ctaText={__( 'Buy now!', 'jetpack-boost' )}
			{onCtaClick}
			infoText={__( "Buy now and we'll include a free toaster!", 'jetpack-boost' )}
		/>
	</div>
</div>

<div class="jb-section--alt jb-section--scores">
	<Score />
</div>

{#if $subPage}
	<div class="jb-section jb-section--subpage">
		<svelte:component this={$subPage} />
	</div>
{:else}
	<div class="jb-section jb-section--main">
		<Modules />
	</div>
{/if}

<div class="jb-section--alt">
	<Tips />
</div>
