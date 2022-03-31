<script>
	/**
	 * Internal dependencies
	 */
	import ReactComponent from '../../../elements/ReactComponent.svelte';

	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';
	import { Button } from '@wordpress/components';

	const openSupport = () => {
		const supportUrl = 'https://jetpackme.wordpress.com/contact-support/';

		window.open( supportUrl, '_blank' );
	};
</script>

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
			<ReactComponent
				this={Button}
				label={__( 'Continue', 'jetpack-boost' )}
				onClick={openSupport}
				className="jb-button jb-button--outline"
				children={__( 'Contact Us', 'jetpack-boost' )}
			/>
		</div>
	</div>
</div>
