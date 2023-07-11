<script lang="ts">
	import { __ } from '@wordpress/i18n';
</script>

<div class="jb-score-context">
	<span class="jb-score-context__info-icon">i</span>
	<div class="jb-score-context__info-container">
		<p>
			{__(
				'In addition to the Homepage, Pages and Posts, Boost will also analyze the following custom post types found on your site:',
				'jetpack-boost'
			)}
		</p>
		<ul>
			<!-- svelte-ignore missing-declaration -->
			{#each Object.entries( Jetpack_Boost.siteCustomPostTypes ) as [slug, label]}
				<li>{label}</li>
			{/each}
		</ul>
		<i />
	</div>
</div>

<style scope="scss">
	ul {
		list-style: outside;
		margin-left: 20px;
	}

	ul:last-of-type {
		margin-bottom: 0;
	}
</style>
