<script>
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import { BoostPricingTable } from '../../react-components/BoostPricingTable.jsx';
	import Header from '../../sections/Header.svelte';
	import config, { markGetStartedComplete } from '../../stores/config';
	import { updateModuleState } from '../../stores/modules';
	import { recordBoostEvent } from '../../utils/analytics';
	import { getUpgradeURL } from '../../utils/upgrade';

	$: pricing = $config.pricing;

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let navigate, location;
	const chooseFreePlan = async () => {
		// Not awaiting for the promise to resolve, as we don't want to block the navigation.
		markGetStartedComplete();

		// Need to await in this case because the generation request needs to go after the backend has enabled the module.
		await updateModuleState( 'critical-css', true );

		navigate( '/' );
	};

	const choosePaidPlan = async () => {
		await recordBoostEvent( 'premium_cta_from_getting_started_page_in_plugin', {} );
		window.location.href = getUpgradeURL();
	};
</script>

<div id="jb-settings" class="jb-settings jb-settings--main">
	<div class="jb-container">
		<Header />
	</div>

	<div class="jb-section jb-section--alt">
		<div class="jb-container">
			<ReactComponent
				this={BoostPricingTable}
				{pricing}
				onPremiumCTA={choosePaidPlan}
				onFreeCTA={chooseFreePlan}
			/>
		</div>
	</div>
</div>
