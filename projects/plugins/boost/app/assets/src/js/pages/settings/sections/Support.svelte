<script>
	import { __ } from '@wordpress/i18n';
	import { hasPrioritySupport, openPaidSupport } from '../../../utils/paid-plan';
</script>

{#if $hasPrioritySupport}
	<div class="jb-section">
		<div class="jb-container--narrow">
			<div class="jb-support">
				<div class="jb-support__content">
					<h3 class="jb-support__title">
						{__( "We're here to help", 'jetpack-boost' )}
					</h3>
					<p class="jb-support__description">
						{__(
							'Your paid plan gives you access to prioritized Jetpack Boost support',
							'jetpack-boost'
						)}
					</p>
				</div>
				<div class="jb-support__cta">
					<button
						class="components-button jb-button jb-button--outline"
						on:click={openPaidSupport}
						type="button"
					>
						{__( 'Contact Us', 'jetpack-boost' )}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
