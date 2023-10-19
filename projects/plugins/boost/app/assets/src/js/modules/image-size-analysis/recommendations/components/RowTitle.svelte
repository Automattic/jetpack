<script lang="ts">
	export let title: string;
	export let url: string;

	const urlWithoutProtocol = url.replace( /^https?:\/\/(www\.)?/, '' );
</script>

<b class="jb-row-title__heading" {title}>{title}</b>
<a href={url} target="_blank" class="jb-row-title__link">
	{urlWithoutProtocol}
</a>
