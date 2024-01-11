<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { cubicOut } from "svelte/easing";
	import { slide } from "svelte/transition";
	import Toggle from "../../Components/Toggle.svelte";
	import { API, options } from "../../Options";
	import ActivateMonitor from "./ActivateMonitor.svelte";

	const dispatch = createEventDispatcher();

	async function clear() {
		if (await API.DELETE("clear") === "OK") {
			dispatch("clear");
		}
	}

	const incoming = options.observerIncoming.value;
	const outgoing = options.observerOutgoing.value;
	const isMonitoring = options.monitorStatus.value;

	let expanded = false;
</script>

<div class="actions">
	<div class="advanced">
		<div class="toggle-monitor">
			<label for="monitor">
				<Toggle id="monitor" checked={$isMonitoring} on:click={() => $isMonitoring = !$isMonitoring} />
				<strong>Monitor Requests</strong>
			</label>
		</div>
		<button
			class:active={expanded}
			class="button-effects advanced__button"
			on:click={() => (expanded = !expanded)}
			>{@html expanded ? "&uarr;" : "&darr;"} Monitor Settings</button
		>
		{#if expanded}
			<div
				class="advanced__expanded"
				transition:slide={{ easing: cubicOut, duration: 300 }}
			>
				<div class="info">
					<h4>Filter monitored requests</h4>
					<p>
						By default, incoming and outgoing requests are monitored by default.
						Use the settings below to control which requests are monitored.
					</p>
					<p>
						Requests can be filterd by URL. Partial queries and wildcards are
						supported.
					</p>
				</div>

				<ActivateMonitor
					label="Monitor Incoming"
					bind:isActive={$incoming.enabled}
					bind:filter={$incoming.filter}
				/>

				<ActivateMonitor
					label="Monitor Outgoing"
					bind:isActive={$outgoing.enabled}
					bind:filter={$outgoing.filter}
				/>
			</div>
		{/if}
	</div>

	<button id="clear" class="ji-button" on:click|preventDefault={clear}>
		Clear All
	</button>
</div>

<style lang="scss">
	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding-top: 20px;
		padding-bottom: 20px;
	}

	.toggle-monitor {
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		label {
			display: flex;
			gap: 10px;
			align-items: center;
		}
	}

	.advanced {
		position: relative;
	}

	.advanced__expanded {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 20px 30px;
		background-color: var(--primary-white);
		border-radius: 10px;
		width: min(540px, 85vw);
		position: absolute;
		top: calc(100% + 10px);
		left: -10px;
		z-index: 100;
		--shadow-color: 0deg 0% 56%;
		box-shadow: 0px 0.2px 0.2px hsl(var(--shadow-color) / 0.29),
			0px 0.9px 1.1px -0.6px hsl(var(--shadow-color) / 0.36),
			0px 2.1px 2.6px -1.1px hsl(var(--shadow-color) / 0.43),
			0px 4.8px 6px -1.7px hsl(var(--shadow-color) / 0.5);
	}

	.advanced__button {
		display: block;
		background-color: var(--primary-white);
		position: relative;
		padding: 4px 10px;
		border-radius: 20px;
		width: 160px;
		cursor: pointer;
		border: 0;
		transition: all 0.2s ease-in-out;
		&.active {
			background-color: var(--alt_white);
		}
	}

	.info {
		h4 {
			margin-top: 10px;
			margin-bottom: 5px;
		}
		p {
			margin: 0.5em 0;
		}
	}

	#clear {
		margin-left: auto;
	}
</style>
