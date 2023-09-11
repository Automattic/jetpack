<script lang="ts">
	import { useNavigate } from 'svelte-navigator';
	import BackButton from '../elements/BackButton.svelte';
	import ChevronRight from '../svg/chevron-right.svg';
	import Logo from '../svg/logo.svg';

	const navigate = useNavigate();

	export let subPage: string | null = null;
</script>

<div class="jb-dashboard-header">
	<div class="jb-container masthead">
		<div class="nav-area">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="jb-dashboard-header__logo" on:click={() => navigate( '/' )}>
				<Logo />
			</div>

			{#if subPage}
				<div class="chevron">
					<ChevronRight />
				</div>

				<div class="subpage">
					{subPage}
				</div>
			{/if}
		</div>

		<slot />
	</div>

	{#if subPage}
		<div class="jb-container back-button">
			<BackButton route="/" />
		</div>
	{/if}
</div>

<style lang="scss">
	.jb-dashboard-header {
		background-color: var( --primary-white );
	}

	.masthead {
		display: flex;
		justify-content: space-between;
		margin-top: 40px;
		margin-bottom: 20px;
		align-items: center;
		flex-wrap: wrap;
		gap: 24px;
	}

	.nav-area {
		display: flex;
		align-items: center;
		flex-direction: row;

		.jb-dashboard-header__logo {
			cursor: pointer;

			:global( svg ) {
				height: 42px;
				width: 100%;
			}
		}

		.chevron {
			margin-left: 16px;
			margin-right: 16px;
			width: 24px;
			height: 24px;
			padding-top: 2px;
			text-align: center;
		}

		.subpage {
			color: var( --gray-40 );
			font-size: 16px;
			margin-top: -2px;
		}
	}
</style>
