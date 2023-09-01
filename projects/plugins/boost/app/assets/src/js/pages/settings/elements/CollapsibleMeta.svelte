<script lang="ts">
	import PencilIcon from '../../../svg/pencil.svg';

	export let editText: string;
	export let closeEditText: string;

	let isEditing = false;
</script>

<div class="jb-collapsible-meta">
	<header class="jb-collapsible-meta__header">
		<button
			type="button"
			class="jb-collapsible-meta__edit-button components-button is-link"
			on:click={() => {
				isEditing = ! isEditing;
			}}
		>
			<PencilIcon class="edit-icon" />
			{isEditing ? closeEditText : editText}
		</button>

		<slot name="header" />
	</header>

	{#if isEditing}
		<slot />
	{:else}
		<div class="summary">
			<slot name="summary" />
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../../../../css/main/variables.scss' as *;

	.jb-collapsible-meta {
		&__edit-button {
			float: right;
		}

		.summary {
			color: $gray-40;
			font-size: 14px;
			line-height: 22px;
		}
	}

	:global( .jb-collapsible-meta__edit-button .edit-icon ) {
		fill: $jetpack-green-50;
		margin: 4px 4px 2px 0;
	}
</style>
