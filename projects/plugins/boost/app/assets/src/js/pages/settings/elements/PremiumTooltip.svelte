<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import Tooltip from '../../../elements/Tooltip.svelte';
	import { recordBoostEvent } from '../../../utils/analytics';
	import routerHistory from '../../../utils/router-history';

	const { navigate } = routerHistory;

	function showBenefits() {
		const eventProps = {};
		recordBoostEvent( 'upsell_cta_from_settings_page_tooltip_in_plugin', eventProps );
		navigate( '/upgrade' );
	}
</script>

<Tooltip title={__( 'Manual Critical CSS regeneration', 'jetpack-boost' )}>
	<p>
		{__(
			'Actions that could change your CSS or HTML structure included but are not limited to:',
			'jetpack-boost'
		)}
	</p>
	<ul>
		<li>{__( 'Make theme changes.', 'jetpack-boost' )}</li>
		<li>{__( 'Write a new post/page.', 'jetpack-boost' )}</li>
		<li>{__( 'Edit a post/page.', 'jetpack-boost' )}</li>
		<li>
			{__(
				'Activate, deactivate, or update plugins that impact your site layout or HTML structure.',
				'jetpack-boost'
			)}
		</li>
		<li>
			{__(
				'Change settings of plugins that impact your site layout or HTML structure.',
				'jetpack-boost'
			)}
		</li>
		<li>
			{__(
				'Upgrade your WordPress version if the new release includes core CSS changes.',
				'jetpack-boost'
			)}
		</li>
	</ul>
	<!-- svelte-ignore a11y-invalid-attribute -->
	<p>
		{__( 'If you’d like automatic Critical CSS regeneration', 'jetpack-boost' )}
		<a href="#" on:click|preventDefault={showBenefits}>{__( 'Upgrade now', 'jetpack-boost' )}</a>
	</p>
</Tooltip>

<style lang="scss">
	a {
		white-space: nowrap;
	}

	ul {
		margin: 30px 0 30px 30px;
		list-style-type: disc;
	}

	p {
		margin: 0 0 20px 0;

		&:last-of-type {
			margin-bottom: 0;
		}
	}
</style>
