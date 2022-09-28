<script>
	import { __ } from '@wordpress/i18n';
	import ErrorNotice from '../../elements/ErrorNotice.svelte';
	import TemplatedString from '../../elements/TemplatedString.svelte';
	import { connection } from '../../stores/connection';
	import CheckboxIcon from '../../svg/checkbox.svg';
	import { onConnectionComplete } from '../../utils/connection';
	import externalLinkTemplateVar from '../../utils/external-link-template-var';
	import { jetpackURL } from '../../utils/jetpack-url';

	const benefits = [
		__( 'Speed up your site load time', 'jetpack-boost' ),
		__( 'Decrease bounce rate of your visitors', 'jetpack-boost' ),
		__( 'Improve your SEO ranking', 'jetpack-boost' ),
		__( 'Sell more stuff', 'jetpack-boost' ),
	];

	$: if ( $connection.connected ) {
		onConnectionComplete();
	}
</script>

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

		<button
			type="button"
			class="components-button is-primary"
			on:click={connection.initialize}
			disabled={$connection.isConnecting}
		>
			{#if $connection.isConnecting}
				{__( 'Connecting to WordPress.com', 'jetpack-boost' )}
			{:else}
				{__( 'Get Started', 'jetpack-boost' )}
			{/if}
		</button>

		<div class="jb-connection-overlay">
			<p>
				<TemplatedString
					template={__(
						`By clicking the button above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareLink>share details</shareLink> with WordPress.com.`,
						'jetpack-boost'
					)}
					vars={{
						...externalLinkTemplateVar(
							jetpackURL( 'https://jetpack.com/redirect/?source=wpcom-tos' ),
							'tosLink'
						),
						...externalLinkTemplateVar(
							jetpackURL(
								'https://jetpack.com/redirect/?source=jetpack-support-what-data-does-jetpack-sync'
							),
							'shareLink'
						),
					}}
				/>
			</p>
		</div>
	</div>
</div>
