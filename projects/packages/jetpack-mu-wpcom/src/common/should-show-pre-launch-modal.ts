interface SitePlan {
	product_slug: string;
	product_name?: string;
}

interface PreLaunchEligibility {
	sitePlan?: SitePlan | null;
	hasCustomDomain?: boolean;
}

/**
 * Whether a site should confirm launch via the pre-launch modal.
 *
 * Sites on a paid plan with a custom domain skip Calypso's domain and plan
 * steps, so we confirm with the pre-launch modal before handing off. Every
 * other site redirects straight to the launch flow, preserving today's
 * behavior.
 *
 * @param site                 - The site's launch eligibility inputs.
 * @param site.sitePlan        - The site's paid plan, if any.
 * @param site.hasCustomDomain - Whether the site has a custom domain.
 * @return Whether the pre-launch modal should be shown.
 */
export function shouldShowPreLaunchModal( { sitePlan, hasCustomDomain }: PreLaunchEligibility ) {
	return !! sitePlan && !! hasCustomDomain;
}
