<script lang="ts">
	import ReRouter from '../../elements/ReRouter.svelte';
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import config from '../../stores/config';
	import { Router, Route } from '../../utils/router';
	import AdvancedCriticalCss from './sections/AdvancedCriticalCss.svelte';
	import Modules from './sections/Modules.svelte';
	import Score from './sections/Score.svelte';
	import Support from './sections/Support.svelte';
	import Tips from './sections/Tips.svelte';
</script>

<ReRouter to="/getting-started" when={$config.site.getStarted}>
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
</ReRouter>
