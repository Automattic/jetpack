<script lang="ts">
	import InfoIcon from '../svg/info.svg';
	import WarningIcon from '../svg/warning-outline.svg';

	export let style: 'info' | 'warning' = 'info';
	export let headline: string;
	export let message: string;
</script>

<style>
	.cross-sell-notice {
		display: flex;
		border: 1px solid #dcdcde;
		border-radius: 4px;
		padding: 25px 64px 25px 28px;
		align-items: center;
	}

	.cross-sell-notice.warning {
		border-color: #faa754;
	}

	.message {
		flex-grow: 1;
	}

	.heading {
		font-weight: bold;
		margin-bottom: 8px;
	}

	.cross-sell-notice :global( .icon ) {
		width: 16px;
		height: 16px;
		margin-right: 21px;
	}
</style>

<div class="cross-sell-notice {style}">
	{#if style === 'warning'}
		<WarningIcon class="icon" />
	{:else if style === 'info'}
		<InfoIcon class="icon" />
	{/if}

	<div class="message">
		<div class="heading">{headline}</div>

		{message}
	</div>

	<slot name="actions" />
</div>
