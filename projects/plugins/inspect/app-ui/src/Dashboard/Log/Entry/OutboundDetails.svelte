<script lang="ts">
	import Tab from "../../../Components/Tabs/Tab.svelte";
	import TabList from "../../../Components/Tabs/TabList.svelte";
	import TabPanel from "../../../Components/Tabs/TabPanel.svelte";
	import Tabs from "../../../Components/Tabs/Tabs.svelte";
	import PrettyJSON from "../PrettyJSON.svelte";
	import type { OutgoingDetails } from "../../../utils/ZodSchema";

	export let details: OutgoingDetails;

	const { args, response } = details;

</script>

<Tabs>
	<TabList>
		<Tab>Body</Tab>
		<Tab>Headers</Tab>
		<Tab>Cookies</Tab>
		<Tab>Args</Tab>
		<Tab>Raw Response</Tab>
	</TabList>

	<TabPanel>
		{#if "body" in response}
			<PrettyJSON data={response.body} />
		{:else}
			<div class="error">Whoops! An error!</div>
			<PrettyJSON data={response} />
		{/if}
	</TabPanel>

	<TabPanel>
		{#if "headers" in response}
			<PrettyJSON data={response.headers} />
		{/if}
	</TabPanel>

	<TabPanel>
		{#if "cookies" in response}
			<PrettyJSON data={response.cookies} />
		{/if}
	</TabPanel>

	<TabPanel>
		<div class="note">
			These are the arguments passed to <code>wp_remote_*</code> function.
		</div>
		<PrettyJSON data={args} />
	</TabPanel>

	<TabPanel>
		<PrettyJSON data={response} />
	</TabPanel>
</Tabs>

<style>
	.note {
		padding-top: 20px;
	}
</style>
