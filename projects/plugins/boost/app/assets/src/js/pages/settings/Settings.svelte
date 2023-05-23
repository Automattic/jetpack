<script lang="ts">
	import { derived } from 'svelte/store';
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import config from '../../stores/config';
	import { connection } from '../../stores/connection';
	import { Router, Route } from '../../utils/router';
	import AdvancedCriticalCss from './sections/AdvancedCriticalCss.svelte';
	import Modules from './sections/Modules.svelte';
	import Score from './sections/Score.svelte';
	import Support from './sections/Support.svelte';
	import Tips from './sections/Tips.svelte';

	const shouldGetStarted = derived( [ config, connection ], ( [ $config, $connection ] ) => {
		return $config.site.getStarted || ( ! $connection.connected && $config.site.online );
	} );

	$: if ( $shouldGetStarted ) {
		window.location.href = './admin.php?page=my-jetpack#/add-boost';
	}
</script>

{#if ! $shouldGetStarted}
	<div id="jb-dashboard" class="jb-dashboard jb-dashboard--main">
		<Header />

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
{/if}
