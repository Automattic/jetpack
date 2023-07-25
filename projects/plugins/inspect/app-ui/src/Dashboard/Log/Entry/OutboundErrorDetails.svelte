<script lang="ts">
	import Tab from "../../../Components/Tabs/Tab.svelte";
	import TabList from "../../../Components/Tabs/TabList.svelte";
	import TabPanel from "../../../Components/Tabs/TabPanel.svelte";
	import Tabs from "../../../Components/Tabs/Tabs.svelte";
	import PrettyJSON from "../PrettyJSON.svelte";
	import type { OutgoingError } from "../../../utils/ZodSchema";

	export let details: OutgoingError;
</script>

<Tabs>
	<TabList>
		<Tab>Errors</Tab>
		<Tab>Args</Tab>
	</TabList>

	<TabPanel>
		{#each Object.entries(details.error.errors) as [error, name]}
			<h4>{name}</h4>
			<p>{error}</p>
		{/each}
		{#if details.error.error_data}
			<PrettyJSON data={details.error.error_data} />
		{/if}
	</TabPanel>

	<TabPanel>
		<PrettyJSON data={details.args} />
	</TabPanel>
</Tabs>
