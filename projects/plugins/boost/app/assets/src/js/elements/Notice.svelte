<script lang="ts">
	import { Button, Notice } from '@automattic/jetpack-components';
	import React from 'react';
	import { slide } from 'svelte/transition';
	import { dismissedPopOuts } from '../stores/config';
	import ReactComponent from './ReactComponent.svelte';

	type ActionButton = {
		label: string;
		onClick?: () => void;
		isLoading?: boolean;
		disabled?: boolean;
	};

	export let level: 'info' | 'warning' | 'success' | 'error' = 'info';
	export let title: string;
	export let message: string;
	export let actions: ActionButton[] | undefined;
	export let dismissalKey: string | undefined;

	$: isDismissed = dismissalKey && $dismissedPopOuts.includes( dismissalKey );

	$: actionComponents =
		! isDismissed &&
		actions?.map( ( action, index ) =>
			React.createElement(
				Button,
				{
					isPrimary: true,
					onClick: action.onClick,
					key: index,
					isLoading: !! action.isLoading,
					disabled: !! action.disabled,
				},
				action.label
			)
		);

	function dismiss() {
		dismissedPopOuts.dismiss( dismissalKey );
	}
</script>

{#if ! isDismissed}
	<div transition:slide|local>
		<ReactComponent
			this={Notice}
			{level}
			{title}
			children={message}
			actions={actionComponents}
			onClose={dismissalKey ? dismiss : undefined}
			hideCloseButton={! dismissalKey}
		/>
	</div>
{/if}
