<script lang="ts">
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

	$: {
		// If the user has Cloud CSS, assume they already got started.
		if ( $config.site.getStarted ) {
			navigate( '/getting-started' );
		}
	}
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
