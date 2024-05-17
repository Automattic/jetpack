<script lang="ts">
	import Tab from "../../../Components/Tabs/Tab.svelte";
	import TabList from "../../../Components/Tabs/TabList.svelte";
	import TabPanel from "../../../Components/Tabs/TabPanel.svelte";
	import Tabs from "../../../Components/Tabs/Tabs.svelte";
	import PrettyJSON from "../PrettyJSON.svelte";
	import type { IncomingDetails } from "../../../utils/ZodSchema";

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
		<div class="note">
			This is the response returned by this WordPress instance.
		</div>
		<PrettyJSON data={response} />
	</TabPanel>
</Tabs>

<style>
	.note {
		padding-top: 20px;
	}
</style>
