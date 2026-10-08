<script lang="ts">
	import { fade } from 'svelte/transition';
	import JetpackLogo from './JetpackLogo.svelte';
</script>

<div class="jb-ig-spinner spinner" out:fade={{ duration: 300 }}>
	<JetpackLogo size={12} bg="transparent" />
</div>
