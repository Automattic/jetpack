<script lang="ts">
	import { derived } from 'svelte/store';
	import ReRouter from '../../elements/ReRouter.svelte';
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
</script>

<ReRouter to="/getting-started" when={$shouldGetStarted}>
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
</ReRouter>

<style lang="scss">
	.jb-section--main {
		z-index: 14;
	}
</style>
