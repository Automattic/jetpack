<script lang="ts">
	import CloseIcon from '../../../svg/close.svg';
	import PencilIcon from '../../../svg/pencil.svg';

	export let editText: string;
	export let closeEditText: string;

	let isEditing = false;
</script>

<div class="jb-collapsible-meta">
	<header class="jb-collapsible-meta__header">
		<slot name="header" />
		<button
			type="button"
			class="jb-collapsible-meta__edit-button components-button is-link"
			on:click={() => {
				isEditing = ! isEditing;
			}}
		>
			{#if isEditing}
				<CloseIcon class="edit-icon" />
				{closeEditText}
			{:else}
				<PencilIcon class="edit-icon" />
				{editText}
			{/if}
		</button>
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
		margin-top: 2em;

		&__header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 1em;
			@media screen and ( max-width: 530px ) {
				flex-direction: column;
				align-items: flex-start;
			}
		}

		&__edit-button {
			padding: 4px;
		}

		.summary {
			color: $gray-40;
			font-size: 14px;
			line-height: 22px;
		}
	}

	:global( .jb-collapsible-meta__edit-button .edit-icon ) {
		fill: $jetpack-green-50;
		color: $jetpack-green-50;
		margin: 4px 4px 2px 0;
	}
</style>
