<!--
	Handle rerouting away from this page when a condition is met.
	Prevents child elements from ever being rendered if the condition has been met,
	which can be important when dealing with things like child-routes.
-->
<script lang="ts">
	import { useNavigate } from 'svelte-navigator';

	export let when: boolean;
	export let to: string;

	// This ain't React.
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const navigate = useNavigate();

	if ( when ) {
		navigate( to );
	}
</script>

{#if ! when}
	<slot />
{/if}
