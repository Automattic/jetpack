<script lang="ts">
	import Form from "./Dashboard/Form.svelte";
	import LogActions from "./Dashboard/Log/Actions.svelte";
	import LogList from "./Dashboard/Log/List.svelte";
	import Logo from "./Dashboard/Logo.svelte";
	import { createPersistentStore } from "./utils/peristentStore";
	import type { LogEntry } from "./utils/ZodSchema";

	let logEntry: LogEntry | false = false;
	function onLogSelect(e: CustomEvent<LogEntry>) {
		logEntry = e.detail;
	}
	function onLogReset() {
		logEntries = [];
	}

	const isFormOpen = createPersistentStore("jetpack_devtools_form_open", false);
	let logRefresh = true;
	let logEntries: LogEntry[] = [];
</script>

<main>
	<div class="top">
		<Logo />
		<div class="controls">
			<button
				class="ji-button"
				on:click|preventDefault={() => ($isFormOpen = !$isFormOpen)}
			>
				New Request
			</button>
		</div>
	</div>
	{#if $isFormOpen}
		<Form bind:logEntry on:submit={() => (logRefresh = true)} />
	{/if}

	<div class="logs">
		<LogActions  on:clear={onLogReset} />

		<LogList
			bind:entries={logEntries}
			bind:refresh={logRefresh}
			on:select={onLogSelect}
		/>
	</div>
</main>

<style>
	.top {
		padding: 30px 40px;
		background-color: var(--gray_0);
	}

	.controls {
		display: flex;
	}

	main {
		margin-left: -20px;
	}

	.logs {
		padding: 10px 40px;
	}
</style>
