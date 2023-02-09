<script lang="ts">
	import { TermsOfService } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';
	import ErrorNotice from '../../elements/ErrorNotice.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import { connection } from '../../stores/connection';
	import CheckboxIcon from '../../svg/checkbox.svg';

	const benefits = [
		__( 'Speed up your site load time', 'jetpack-boost' ),
		__( 'Decrease bounce rate of your visitors', 'jetpack-boost' ),
		__( 'Improve your SEO ranking', 'jetpack-boost' ),
		__( 'Sell more stuff', 'jetpack-boost' ),
	];
</script>

<div id="jb-settings" class="jb-settings jb-settings--main">
	<div class="jb-container">
		<Header />
	</div>

	<div class="jb-section__inner connection">
		<div class="jb-connection">
			<div class="jb-connection__header">
				<h1 class="jb-connection__title">
					{__( 'Get faster loading times with Jetpack Boost', 'jetpack-boost' )}
				</h1>
				<p class="jb-connection__description">
					{__(
						'Connect Jetpack Boost and we will make your site faster in no time.',
						'jetpack-boost'
					)}
				</p>
			</div>

			<div class="checklist">
				{#each benefits as benefit}
					<div class="checklist__item">
						<CheckboxIcon />
						<span>{benefit}</span>
					</div>
				{/each}
			</div>

			{#if $connection.error}
				<ErrorNotice
					title={__( 'Failed to connect to WordPress.com', 'jetpack-boost' )}
					suggestion={__(
						'If you need further assistance, contact <support>Jetpack Boost Support</support>.',
						'jetpack-boost'
					)}
					error={$connection.error}
				/>
			{/if}

			<div class="jb-connection-overlay">
				<p class="jb-connection__terms-of-service">
					<ReactComponent
						this={TermsOfService}
						agreeButtonLabel={__( 'Get Started', 'jetpack-boost' )}
					/>
				</p>
			</div>

			<button
				type="button"
				class="components-button is-jb-primary"
				on:click={connection.initialize}
				disabled={$connection.isConnecting}
			>
				{#if $connection.isConnecting}
					{__( 'Connecting to WordPress.com', 'jetpack-boost' )}
				{:else}
					{__( 'Get Started', 'jetpack-boost' )}
				{/if}
			</button>
		</div>
	</div>

	<Footer />
</div>
