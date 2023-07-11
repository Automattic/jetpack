<script lang="ts">
	import { useNavigate } from 'svelte-navigator';
	import { __ } from '@wordpress/i18n';
	import LeftArrow from '../svg/left-arrow.svg';

	const navigate = useNavigate();

	export let route: number | string = -1;
</script>

<button
	class="components-button components-button--back is-link close"
	on:click={() => navigate( route )}
>
	<LeftArrow />
	{__( 'Go back', 'jetpack-boost' )}
</button>
