<script lang="ts">
	import { maybeStringify } from "../../../../packages/Async_Option/scripts/utils";

	// eslint-disable-next-line
	export let data: any;
</script>

<div>
	<pre>{maybeStringify(data)}</pre>
</div>

<style>
	pre {
		background-color: #f3f3f3;
		padding: 20px;
		overflow: auto;
	}
</style>
