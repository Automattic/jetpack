<script>
	/**
	 * Internal dependencies
	 */
	import LeftArrow from '../svg/left-arrow.svg';

	/**
	 * External dependencies
	 */
	import routerHistory from '../utils/router-history.ts';

	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';

	const { navigate } = routerHistory;

	export let route = -1;
</script>

<button
	class="components-button components-button--back is-link close"
	on:click={() => navigate( route )}
>
	<LeftArrow />
	{__( 'Go back', 'jetpack-boost' )}
</button>
