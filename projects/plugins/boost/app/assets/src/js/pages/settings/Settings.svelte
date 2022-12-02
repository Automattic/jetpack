<script lang="ts">
	import { onMount } from 'svelte';
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import config from '../../stores/config';
	import { Router, Route } from '../../utils/router';
	import AdvancedCriticalCss from './sections/AdvancedCriticalCss.svelte';
	import Modules from './sections/Modules.svelte';
	import Score from './sections/Score.svelte';
	import Support from './sections/Support.svelte';
	import Tips from './sections/Tips.svelte';

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let location, navigate;

	onMount( () => {
		if ( $config.site.getStarted ) {
			// Use a timeout, because it's not ok to navigate during page setup. Svelte-navigator doesn't like that.
			setTimeout( () => {
				navigate( '/getting-started' );
			}, 0 );
		}
	} );
</script>

<div id="jb-settings" class="jb-settings jb-settings--main">
	<div class="jb-container">
		<Header />
	</div>

	<div class="jb-section jb-section--alt jb-section--scores">
		<Score />
	</div>

	<Router>
		<div class="jb-section jb-section--main">
			<Route path="critical-css-advanced" component={AdvancedCriticalCss} />
			<Route path="/" component={Modules} />
		</div>
	</Router>

	<Tips />

	<Support />

	<Footer />
</div>
