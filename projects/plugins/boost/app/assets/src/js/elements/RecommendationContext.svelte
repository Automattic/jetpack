<script lang="ts">
	import { __, sprintf } from '@wordpress/i18n';
	import TemplatedString from './TemplatedString.svelte';
</script>

<div class="jb-score-context">
	<span class="jb-score-context__info-icon">i</span>
	<div class="jb-score-context__info-container">
		<p>
			<TemplatedString
				template={sprintf(
					// translators: %s is Image CDN.
					__(
						'A lot of the reported issues can be easily fixed by enabling the %s feature.',
						'jetpack-boost'
					),
					'<b>' + __( 'Image CDN', 'jetpack-boost' ) + '</b>'
				)}
				vars={{
					b: [ 'strong', {}, '' ],
				}}
			/>
		</p>
		<p><small>{__( 'You`ll need to analyze again if you enable it.', 'jetpack-boost' )}</small></p>
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

	p:last-of-type {
		margin-bottom: 0;
	}
</style>
