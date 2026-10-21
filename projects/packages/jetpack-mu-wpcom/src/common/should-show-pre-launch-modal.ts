interface SitePlan {
	product_slug: string;
	product_name?: string;
}

interface PreLaunchEligibility {
	sitePlan?: SitePlan | null;
	hasCustomDomain?: boolean;
	isTrial?: boolean;
}

/**
 * Whether a site should confirm launch via the pre-launch modal.
 *
 * Sites on a paid plan with a custom domain skip Calypso's domain and plan
 * steps, so we confirm with the pre-launch modal before handing off. Every
 * other site redirects straight to the launch flow, preserving today's
 * behavior.
 *
 * Trials are excluded: they carry the plan and custom-domain feature
 * entitlements without having purchased a plan or registered a domain, so
 * they still need Calypso's upsell steps.
 *
 * @param site                 - The site's launch eligibility inputs.
 * @param site.sitePlan        - The site's paid plan, if any.
 * @param site.hasCustomDomain - Whether the site has a custom domain.
 * @param site.isTrial         - Whether the site is on a trial plan.
 * @return Whether the pre-launch modal should be shown.
 */
export function shouldShowPreLaunchModal( {
	sitePlan,
	hasCustomDomain,
	isTrial,
}: PreLaunchEligibility ) {
	return !! sitePlan && !! hasCustomDomain && ! isTrial;
}
