<script lang="ts">
	import ReRouter from '../../elements/ReRouter.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import Footer from '../../react-components/sections/footer';
	import Header from '../../react-components/sections/header';
	import Support from '../../react-components/sections/support';
	import config from '../../stores/config';
	import { connection } from '../../stores/connection';
	import { criticalCssIssues } from '../../stores/critical-css-state-errors';
	import { hasPrioritySupport } from '../../utils/paid-plan';
	import { Router, Route } from '../../utils/router';
	import AdvancedCriticalCss from './sections/AdvancedCriticalCss.svelte';
	import Modules from './sections/Modules.svelte';
	import Score from './sections/Score.svelte';
	import Tips from './sections/Tips.svelte';

	export let activeModules: boolean[];
	export let criticalCssCreated: number;
	export let criticalCssIsGenerating: boolean;

	$: shouldGetStarted = ! $connection.connected && $config.site.online;
</script>

<ReRouter to="/getting-started" when={shouldGetStarted}>
	<div id="jb-dashboard" class="jb-dashboard jb-dashboard--main">
		<ReactComponent this={Header} />

		<div class="jb-section jb-section--alt jb-section--scores">
			<Score {activeModules} {criticalCssCreated} {criticalCssIsGenerating} />
		</div>

		<Router>
			<div class="jb-section jb-section--main">
				<Route
					path="critical-css-advanced"
					component={AdvancedCriticalCss}
					issues={$criticalCssIssues}
				/>
				<Route path="/" component={Modules} />
			</div>
		</Router>

		<Tips />

		{#if $hasPrioritySupport}
			<ReactComponent this={Support} />
		{/if}

		<ReactComponent this={Footer} />
	</div>
</ReRouter>

<style lang="scss">
	.jb-section--main {
		z-index: 14;
	}
</style>
