<script lang="ts">
	import { useNavigate } from 'svelte-navigator';
	import Logo from '../svg/logo.svg';
	const navigate = useNavigate();
</script>

<div class="jb-dashboard-header">
	<div class="jb-container">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="jb-dashboard-header__logo" on:click={() => navigate( '/' )}>
			<Logo />
		</div>

		<slot />
	</div>
</div>

<style lang="scss">
	.jb-dashboard-header {
		background-color: var( --primary-white );
	}
	.jb-dashboard-header__logo {
		cursor: pointer;
	}

	.jb-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 24px;
	}
</style>
