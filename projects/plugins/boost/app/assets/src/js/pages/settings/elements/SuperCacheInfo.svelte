<script lang="ts">
	import { __, sprintf } from '@wordpress/i18n';
	import CrossSellNotice from '../../../elements/CrossSellNotice.svelte';
	import { measureSuperCacheSaving } from '../../../utils/measure-super-cache-saving';
	import { isSuperCachePluginActive, isSuperCacheEnabled } from '../../../utils/super-cache';

	let testPromise: Promise< number > | null = null;
	function runTest() {
		testPromise = measureSuperCacheSaving();
	}
</script>

{#if isSuperCacheEnabled()}
	{#if !! testPromise}
		{#await testPromise}
			<CrossSellNotice
				headline={__( 'Measuring Super Cache Speed', 'jetpack-boost' )}
				message={__( 'Hold on a moment.', 'jetpack-boost' )}
			/>
		{:then testResult}
			<CrossSellNotice
				headline={__( 'Super Cache Speed', 'jetpack-boost' )}
				message={sprintf(
					// translators: %d refers to the number of milliseconds users are saving by using Super Cache.
					__( 'Super Cache is saving your visitors about %d ms', 'jetpack-boost' ),
					testResult
				)}
			>
				<a href={'#'} slot="actions" class="primary-button" on:click|preventDefault={runTest}>
					{__( 'Run Again', 'jetpack-boost' )}
				</a>
			</CrossSellNotice>
		{:catch testError}
			<CrossSellNotice
				style="warning"
				headline={__( 'Super Cache Speed', 'jetpack-boost' )}
				message={sprintf(
					// translators: %s is the raw error message
					__( 'We ran into an error measuring your speed: %s', 'jetpack-boost' ),
					testError.message
				)}
			>
				<a href={'#'} slot="actions" class="primary-button" on:click|preventDefault={runTest}>
					{__( 'Try Again', 'jetpack-boost' )}
				</a>
			</CrossSellNotice>
		{/await}
	{:else}
		<CrossSellNotice
			headline={__( 'Super Cache detected', 'jetpack-boost' )}
			message={__( 'Find out how much difference it makes for your users.', 'jetpack-boost' )}
		>
			<a href={'#'} slot="actions" class="primary-button" on:click|preventDefault={runTest}>
				{__( 'Test', 'jetpack-boost' )}
			</a>
		</CrossSellNotice>
	{/if}
{:else if isSuperCachePluginActive()}
	<CrossSellNotice
		style="warning"
		headline={__( 'Super Cache is installed but not enabled', 'jetpack-boost' )}
		message={__( 'Enable Super Cache to speed your site up further.', 'jetpack-boost' )}
	>
		<a href="options-general.php?page=wpsupercache" slot="actions" class="primary-button">
			{__( 'Set up', 'jetpack-boost' )}
		</a>
	</CrossSellNotice>
{/if}
