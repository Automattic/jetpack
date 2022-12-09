<script type="ts">
	import PrettyJSON from '@src/Dashboard/Log/PrettyJSON.svelte';
	import Tabs from '@src/Components/Tabs/Tabs.svelte';
	import TabList from '@src/Components/Tabs/TabList.svelte';
	import TabPanel from '@src/Components/Tabs/TabPanel.svelte';
	import Tab from '@src/Components/Tabs/Tab.svelte';
	import type { OutgoingError } from '@src/utils/Validator';

	export let details: OutgoingError;
</script>

<Tabs>
	<TabList>
		<Tab>Errors</Tab>
		<Tab>Args</Tab>
	</TabList>

	<TabPanel>
		{#each Object.entries( details.error.errors ) as [error, name]}
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
