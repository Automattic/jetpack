type LockCopy = { description: string; support_url: string; upgrade_url: string };

const NO_COPY: LockCopy = { description: '', support_url: '', upgrade_url: '' };

/**
 * Script data whose Stats plan gates lock the given features.
 *
 * @param locked   - The locked feature slugs, or each one mapped to its upsell copy.
 * @param sections - The dashboard section slugs, when the code under test reads them.
 * @return The `JetpackScriptData` value.
 */
export function planGatesScriptData(
	locked: readonly string[] | Record< string, LockCopy >,
	sections?: readonly string[]
) {
	const lockedFeatures = Array.isArray( locked )
		? Object.fromEntries( locked.map( feature => [ feature, NO_COPY ] ) )
		: locked;

	return {
		premium_analytics: {
			...( sections && { sections } ),
			plan_date_limited_sections: [ 'traffic' ],
			plan_gates: { locked_features: lockedFeatures, locked_widget_types: {} },
		},
	};
}
