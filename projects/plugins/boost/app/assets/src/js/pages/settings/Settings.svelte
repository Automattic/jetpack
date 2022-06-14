<script>
	import { Router, Route } from '../../utils/router';
	import AdvancedCriticalCss from './sections/AdvancedCriticalCss.svelte';
	import Modules from './sections/Modules.svelte';
	import Score from './sections/Score.svelte';
	import Support from './sections/Support.svelte';
	import Tips from './sections/Tips.svelte';
</script>

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
