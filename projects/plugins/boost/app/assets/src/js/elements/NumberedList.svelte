<script lang="ts">
	import { TemplateVars } from '../utils/copy-dom-template';
	import TemplatedString from './TemplatedString.svelte';

	/**
	 * List of string items to include in the list.
	 */
	export let items: string[];

	/**
	 * Template vars to fill in <template> elements in each list item.
	 */
	export let vars: TemplateVars;
</script>

<ol class="numbered-list">
	{#each items as item, index}
		<li>
			<span class="index">{index + 1}</span>
			<span class="text">
				<TemplatedString template={item} {vars} />
			</span>
		</li>
	{/each}
</ol>
