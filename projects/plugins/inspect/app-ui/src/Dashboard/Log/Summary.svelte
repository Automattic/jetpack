<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { API } from "../../Options";
	import Form from "../Form.svelte";
	import StatusIcon from "./StatusIcon.svelte";
	import type { LogEntry } from "../../utils/ZodSchema";

	const dispatch = createEventDispatcher();

	export let item: LogEntry;
	export let icon: "in" | "out" | "bug";
	export let isOpen = false;

	const { date, url } = item;

	function toggleOpen() {
		isOpen = !isOpen;
	}

	async function retryRequest() {
		if (!item.observer_outgoing) {
			return;
		}
		const data = item.observer_outgoing;
		await API.sendRequest({
			url: item.url,
			method: data.args.method,
			body: data.args.body,
			headers: data.args.headers,
			transport: "wp",
		});
		dispatch("retry", item);
	}

	let edit = false;
	const responseCode = item.observer_outgoing?.response.response.code;
	let bubbleColor = "gray";
	if (responseCode) {
		bubbleColor = responseCode ? "green" : "red";
	}
	if (item.wp_error) {
		bubbleColor = "red";
	}
</script>

<div class="summary">
	<div class="response-type">
		<StatusIcon {icon} />
	</div>

	<div class="header" on:click={toggleOpen} on:keypress={toggleOpen}>
		<div class="date">
			{#if responseCode}
				{responseCode}
				{#if item.observer_outgoing}
					{item.observer_outgoing.args.method}
					{item.observer_outgoing.duration}ms -
				{/if}
			{/if}
			{date}
		</div>

		<div class="url">
			<div class="bubble {bubbleColor}" />
			{url}
		</div>
	</div>

	<div class="actions">
		{#if item.observer_outgoing}
			<button class="ji-button--altii" on:click={retryRequest}>Retry</button>

			<button class="ji-button--altii" on:click={() => (edit = !edit)}
				>Edit</button
			>
		{/if}
		<button class="ji-button--alt" on:click|preventDefault={toggleOpen}>
			{isOpen ? "Hide" : "View"}
		</button>
	</div>
</div>

{#if edit}
	<Form logEntry={item} on:submit={() => (edit = false)} on:submit />
{/if}

<style lang="scss">
	.response-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.response-type {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.bubble {
		width: 5px;
		min-width: 5px;
		height: 5px;
		border-radius: 3px;
		margin-right: 10px;
		transform: translateY(-2.5px);
		background-color: var(--gray_30);
		box-shadow: 0 0 0px 1px hsl(121 1% 60%), 0 0 3px 3px hsl(121 1% 95%);
		&.red {
			background-color: hsl(28deg 94% 70%);
			box-shadow: 0 0 1px 1px hsl(28deg 94% 55%), 0 0 3px 3px hsl(28deg 98% 94%);
		}
		&.green {
			background-color: hsl(121 93% 36%);
			box-shadow: 0 0 0px 1px hsl(121 77% 31%), 0 0 3px 3px hsl(121 70% 80%);
		}
	}
	.actions {
		min-width: 300px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 5px;
	}
	.summary {
		width: 100%;
		padding: 20px;
		gap: 20px;
		display: flex;
		justify-content: space-between;
	}

	.header {
		cursor: pointer;
		margin-right: auto;
	}

	.url {
		font-weight: 500;
		-webkit-font-smoothing: antialiased;
		word-wrap: break-word;
		word-break: break-all;
		color: var(--gray_80);
		display: flex;
		align-items: baseline;
	}

	.date {
		font-size: 0.8em;
		color: #999;
	}
</style>
