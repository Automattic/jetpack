<script>
	import Spinner from '../../../svg/spinner.svg';
	export let score = 0;
	export let isLoading = true;
	export let active = true;

	let fillColor;
	function getFillerClassName( forScore ) {
		if ( isLoading ) {
			return 'fill-loading';
		}

		if ( forScore > 70 ) {
			return 'fill-good';
		}

		if ( forScore > 50 ) {
			return 'fill-mediocre';
		}

		if ( forScore ) {
			return 'fill-bad';
		}
	}

	$: fillColor = getFillerClassName( score );
</script>

<div class="jb-score-bar__bounds">
	{#if active}
		<div class="jb-score-bar__filler {fillColor}" style="width: {score}%;">
			{#if isLoading}
				<div class="jb-score-bar__loading">
					<Spinner />
				</div>
			{:else}
				<div class="jb-score-bar__score">{score}</div>
			{/if}
		</div>
	{/if}
</div>
