<div class="jb-score-context">
	<span class="jb-score-context__info-icon">i</span>
	<div class="jb-score-context__info-container">
		<slot />
		<i />
	</div>
</div>

<style scope="scss">
	.jb-score-context :global( ul ) {
		list-style: outside;
		margin-left: 20px;
	}

	.jb-score-context :global( ul:last-of-type ) {
		margin-bottom: 0;
	}
</style>
