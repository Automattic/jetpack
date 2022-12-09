<script type="ts">
	import type { IncomingDetails } from '@src/utils/Validator';
	import PrettyJSON from '@src/Dashboard/Log/PrettyJSON.svelte';
	import Tabs from '@src/Components/Tabs/Tabs.svelte';
	import TabList from '@src/Components/Tabs/TabList.svelte';
	import TabPanel from '@src/Components/Tabs/TabPanel.svelte';
	import Tab from '@src/Components/Tabs/Tab.svelte';

	export let details: IncomingDetails;

	const { request, response } = details;
</script>

<Tabs>
	<TabList>
		<Tab>Query</Tab>
		<Tab>Body</Tab>
		<Tab>Headers</Tab>
		<Tab>Response</Tab>
	</TabList>

	<TabPanel>
		<PrettyJSON data={request.query} />
	</TabPanel>

	<TabPanel>
		<PrettyJSON data={request.body} />
	</TabPanel>

	<TabPanel>
		<PrettyJSON data={request.headers} />
	</TabPanel>

	<TabPanel>
		<div class="note">This is the response returned by this WordPress instance.</div>
		<PrettyJSON data={response} />
	</TabPanel>
</Tabs>

<style>
	.note {
		padding-top: 20px;
	}
</style>
