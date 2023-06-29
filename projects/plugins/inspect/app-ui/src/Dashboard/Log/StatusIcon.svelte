<script lang="ts">
	export let icon: "in" | "out" | "bug";
</script>

<div class="icon {icon}">
	{#if icon === "out"}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="ionicon"
			viewBox="0 0 512 512"
			><title>Outbound</title><path
				d="M320 367.79h76c55 0 100-29.21 100-83.6s-53-81.47-96-83.6c-8.89-85.06-71-136.8-144-136.8-69 0-113.44 45.79-128 91.2-60 5.7-112 43.88-112 106.4s54 106.4 120 106.4h56"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="32"
			/><path
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="32"
				d="M320 255.79l-64-64-64 64M256 448.21V207.79"
			/></svg
		>
	{/if}

	{#if icon === "in"}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="ionicon"
			viewBox="0 0 512 512"
			><title>Inbound</title><path
				d="M320 336h76c55 0 100-21.21 100-75.6s-53-73.47-96-75.6C391.11 99.74 329 48 256 48c-69 0-113.44 45.79-128 91.2-60 5.7-112 35.88-112 98.4S70 336 136 336h56M192 400.1l64 63.9 64-63.9M256 224v224.03"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="32"
			/></svg
		>
	{/if}

	{#if icon === "bug"}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="ionicon"
			viewBox="0 0 512 512"
			><title>Error</title><path
				d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z"
				fill="none"
				stroke="currentColor"
				stroke-miterlimit="10"
				stroke-width="32"
			/><path
				d="M250.26 166.05L256 288l5.73-121.95a5.74 5.74 0 00-5.79-6h0a5.74 5.74 0 00-5.68 6z"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="32"
			/><path d="M256 367.91a20 20 0 1120-20 20 20 0 01-20 20z" /></svg
		>
	{/if}
</div>

<style lang="scss">
	svg {
		width: 25px;
		height: 25px;
		color: var(--gray_5);
		fill: var(--gray_5);
	}
	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
