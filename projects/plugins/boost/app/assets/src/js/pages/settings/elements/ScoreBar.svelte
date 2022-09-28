<script>
	import Spinner from '../../../svg/spinner.svg';

	export let score = 0;
	export let isLoading = true;
	export let showPrevScores = false;
	export let active = true;
	export let prevScore = 0;
	export let noBoostScoreTooltip = null;

	let fillColor;
	let prevScoreOffset;
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

	$: {
		fillColor = getFillerClassName( score );
		prevScoreOffset = ( prevScore / score ) * 100;
	}
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

			{#if showPrevScores && prevScore && prevScore < score}
				<div
					class="jb-score-bar__no_boost_score"
					style="left: min({prevScoreOffset}%, calc(100% - var(--clearance-space))"
				>
					{prevScore}
					{#if noBoostScoreTooltip}
						<div class="jb-score-bar__no_boost_score_tooltip">
							{noBoostScoreTooltip}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
