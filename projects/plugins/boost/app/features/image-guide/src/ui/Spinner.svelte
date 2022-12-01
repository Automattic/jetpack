<script lang="ts">
	import { fade } from 'svelte/transition';
	import JetpackLogo from './JetpackLogo.svelte';
</script>

<div class="spinner" out:fade={{ duration: 300 }}>
	<JetpackLogo size={12} bg="transparent" />
</div>

<style lang="scss">
	.spinner {
		animation: ease-in-out 1.25s infinite reverse pulse;
		@keyframes pulse {
			0% {
				transform: scale( 1 ) rotate( 0deg );
			}
			70% {
				transform: scale( 1.4 ) rotate( 30deg );
			}

			100% {
				transform: scale( 0.9 ) rotate( -190deg );
			}
		}
	}
</style>
