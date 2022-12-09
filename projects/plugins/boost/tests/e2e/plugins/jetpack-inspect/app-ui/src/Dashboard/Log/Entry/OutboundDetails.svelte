<script type="ts">
	import type { OutgoingDetails } from '@src/utils/Validator';
	import PrettyJSON from '@src/Dashboard/Log/PrettyJSON.svelte';
	import Tabs from '@src/Components/Tabs/Tabs.svelte';
	import TabList from '@src/Components/Tabs/TabList.svelte';
	import TabPanel from '@src/Components/Tabs/TabPanel.svelte';
	import Tab from '@src/Components/Tabs/Tab.svelte';

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
		{#if 'body' in response}
			<PrettyJSON data={response.body} />
		{:else}
			<div class="error">Whoops! An error!</div>
			<PrettyJSON data={response} />
		{/if}
	</TabPanel>

	<TabPanel>
		{#if 'headers' in response}
			<PrettyJSON data={response.headers} />
		{/if}
	</TabPanel>

	<TabPanel>
		{#if 'cookies' in response}
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
