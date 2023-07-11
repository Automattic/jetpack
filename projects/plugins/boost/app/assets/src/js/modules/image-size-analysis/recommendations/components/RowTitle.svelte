<script lang="ts">
	export let title: string;
	export let url: string;

	const urlWithoutProtocol = url.replace( /^https?:\/\/(www\.)?/, '' );
</script>

<b {title}>{title}</b>
<a href={url} target="_blank">
	{urlWithoutProtocol}
</a>

<style lang="scss">
	b {
		display: block;
		font-size: 1.125rem;
		margin-bottom: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	a {
		font-size: 0.875rem;
		color: var( --gray-80 );
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
