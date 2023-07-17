<script lang="ts">
	import ImageCDNRecommendation from './ImageCDNRecommendation.svelte';
</script>

<div class="jb-score-context">
	<span class="jb-score-context__info-icon">i</span>
	<div class="jb-score-context__info-container">
		<ImageCDNRecommendation />
		<i />
	</div>
</div>

<style lang="scss">
	@use '../../css/main/mixins.scss' as *;

	.jb-score-context {
		top: -4px;
	}

	.jb-score-context__info-container {
		left: -118px;
		min-width: 400px;
	}

	.jb-score-context__info-container i {
		left: 315px;
	}

	.jb-score-context__info-icon {
		margin-left: 0;
	}
</style>
