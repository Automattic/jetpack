<!-- Utility: Show a <Link> if a condition is met. Otherwise, just show the contents. -->
<script>
	import { Link } from '../utils/router';

	export let isLink = true;
</script>

{#if isLink}
	<Link {...$$props}><slot /></Link>
{:else}
	<slot />
{/if}
