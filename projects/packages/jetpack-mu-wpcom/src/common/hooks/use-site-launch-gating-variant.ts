/*
 * The site launch gating variant.
 *
 * The ExPlat experiment `calypso_standardized_site_launch_gating_202603_v1`
 * concluded with `semi_gated_site_launch` as the winning variant. It is now the
 * shipped default for all users, so this hook returns it directly instead of
 * calling ExPlat (a concluded experiment always returns the same assignment).
 *
 * The return value mirrors the tuple shape of `useExperimentWithAuth`,
 * `[ isLoading, variant ]`, so call sites read like a live experiment.
 *
 * To wire up the next experiment:
 *   1. Import `useExperimentWithAuth` from `@automattic/jetpack-explat`.
 *   2. Add the new variant name(s) to the `SiteLaunchGatingVariant` type below.
 *   3. Replace the hardcoded return with the live assignment, mapping it onto
 *      this tuple shape:
 *        const [ isLoading, assignment ] = useExperimentWithAuth( '<new_experiment_name>' );
 *        return [ isLoading, ( assignment?.variationName ?? null ) as SiteLaunchGatingVariant ];
 *   4. Add `case` branches for the new variant(s) to the `switch` statements at
 *      each call site (search for references to this hook).
 *
 * This is intentionally a hook so the future swap to `useExperimentWithAuth`
 * obeys the rules of hooks at every call site.
 */

export type SiteLaunchGatingVariant = 'semi_gated_site_launch' | null;

/**
 * Returns the shipped site launch gating variant, mirroring the
 * `useExperimentWithAuth` return shape.
 *
 * @return {[ boolean, SiteLaunchGatingVariant ]} A `[ isLoading, variant ]` tuple.
 */
export default function useSiteLaunchGatingVariant(): [ boolean, SiteLaunchGatingVariant ] {
	return [ false, 'semi_gated_site_launch' ];
}
