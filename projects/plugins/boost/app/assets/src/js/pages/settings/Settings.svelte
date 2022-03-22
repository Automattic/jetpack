<script>
	/**
	 * Internal dependencies
	 */
	import Tips from './sections/Tips.svelte';
	import Score from './sections/Score.svelte';
	import AdvancedCriticalCss from './sections/AdvancedCriticalCss.svelte';
	import Modules from './sections/Modules.svelte';
	import { Router, Route } from '../../utils/router';
</script>

<div class="jb-section--alt jb-section--scores">
	<Score />
</div>

<Router>
	<div class="jb-section jb-section--main">
		<Route path="critical-css-advanced" component={AdvancedCriticalCss} />
		<Route path="/" component={Modules} />
	</div>
</Router>

<div class="jb-section--alt">
	<Tips />
</div>
