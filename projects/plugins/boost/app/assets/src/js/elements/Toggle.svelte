<script type="ts">
	export let id: string;
	export let checked = false;
	export let disabled = false;
</script>

<div class="components-base-control components-toggle-control">
	<div class="components-base-control__field">
		<span class="components-form-toggle" class:is-checked={checked}>
			<input
				{id}
				class="components-form-toggle__input"
				type="checkbox"
				{disabled}
				on:click
				bind:checked
			/>
			<span class="components-form-toggle__track" />
			<span class="components-form-toggle__thumb" /></span
		><label for={id} class="components-toggle-control__label" />
	</div>
</div>
