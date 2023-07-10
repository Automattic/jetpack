<script lang="ts">
	import { truncateString } from '../../../../utils/truncate-string';
	export let title: string;
	export let url: string;
	const maxTitleLength = 20;

	const urlWithoutProtocol = url.replace( /^https?:\/\/(www\.)?/, '' );
	const croppedTitle = truncateString( title, maxTitleLength );
</script>

<b>{croppedTitle}</b>
<a href={url} target="_blank">
	{urlWithoutProtocol}
</a>

<style lang="scss">
	b {
		display: block;
		font-size: 1.125rem;
		margin-bottom: 4px;
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
