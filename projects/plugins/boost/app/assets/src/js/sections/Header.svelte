<script lang="ts">
	import { useNavigate } from 'svelte-navigator';
	import Logo from '../svg/logo.svg';
	const navigate = useNavigate();
</script>

<div class="jb-dashboard-header">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="jb-dashboard-header__logo" on:click={() => navigate( '/' )}>
		<Logo />
	</div>
</div>

<style lang="scss">
	.jb-dashboard-header__logo {
		cursor: pointer;
	}
</style>
