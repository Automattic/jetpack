<script lang="ts">
	export let title: string;
	export let url: string;

	const urlWithoutProtocol = url.replace( /^https?:\/\/(www\.)?/, '' );
</script>

<b>{title}</b>
<span>{urlWithoutProtocol}</span>

<style lang="scss">
	b {
		display: block;
		font-size: 1.125rem;
		margin-bottom: 4px;
	}
	span {
		font-size: 0.875rem;
		color: var( --gray-80 );
	}
</style>
