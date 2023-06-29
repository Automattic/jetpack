<script lang="ts">
	import { sineInOut } from "svelte/easing";
	import LogSummary from "../Summary.svelte";
	import InboundDetails from "./InboundDetails.svelte";
	import OutboundDetails from "./OutboundDetails.svelte";
	import OutboundErrorDetails from "./OutboundErrorDetails.svelte";
	import type { LogEntry } from "../../../utils/ZodSchema";

	export let item: LogEntry;
	let isOpen = false;

	function fade( _: unknown, { duration, delay }: { duration: number; delay: number }) {
		return {
			duration,
			delay,
			css: (t: number) => {
				const lightness = 94 + sineInOut(t) * 6;
				return `background-color: hsl(110deg 21% ${lightness}%);`;
			},
		};
	}

	function getLogType() {
		if (item.observer_incoming) {
			return "observer_incoming";
		}
		if (item.observer_outgoing) {
			return "observer_outgoing";
		}
		if (item.wp_error) {
			return "wp_error";
		}
	}

	type EntryComponent = {
		component:
			| typeof InboundDetails
			| typeof OutboundDetails
			| typeof OutboundErrorDetails;
		// eslint-disable-next-line
		props: { details: any };
		icon: "in" | "out" | "bug";
	};

	function getComponent(): EntryComponent | false {
		const type = getLogType();
		switch (type) {
			case "observer_incoming":
				return {
					component: InboundDetails,
					props: { details: item.observer_incoming },
					icon: "in",
				};
			case "observer_outgoing":
				return {
					component: OutboundDetails,
					props: { details: item.observer_outgoing },
					icon: "out",
				};
			case "wp_error":
				return {
					component: OutboundErrorDetails,
					props: { details: item.wp_error },
					icon: "out",
				};
			default:
				return false;
		}
	}

	const component = getComponent();
	const icon = component ? component.icon : "bug";
</script>

<div class="log-entry" in:fade|local={{ delay: 1000, duration: 560 }}>
	<LogSummary {item} {icon} bind:isOpen on:select on:submit on:retry />
	{#if isOpen && component}
		<svelte:component this={component.component} {...component.props} />
	{/if}
</div>

<style>
	.log-entry {
		border-bottom: 1px solid rgb(215, 215, 215);
		min-height: 78px;
		background-color: #fff;
	}
</style>
