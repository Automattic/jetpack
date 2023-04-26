<script lang="ts">
	export let url: string;
	export let title: string;
	export let width: number;
	export let height: number;
</script>

<img src={url} alt={title} {width} {height} />

<style lang="scss">
	img {
		display: block;
		border-radius: 3px;
	}
</style>
