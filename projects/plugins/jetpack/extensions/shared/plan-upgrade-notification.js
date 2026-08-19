import { isWpcomPlatformSite, isSimpleSite } from '@automattic/jetpack-script-data';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import '@wordpress/notices';

/**
 * Returns a URL where the current site's plan can be viewed from.
 * [Relative to current domain for JP sites]
 *
 * @return {string|null} A URL where the current site plan is viewable - null if not retrievable.
 */
function getPlanUrl() {
	const siteFragment = getSiteFragment();

	if ( window?.location && siteFragment ) {
		if ( isWpcomPlatformSite() ) {
			return `https://wordpress.com/plans/my-plan/${ siteFragment }`;
		}

		// Potentially a JP site may have a wordpress root: https//foo.com/custom/wp/root
		// Unlikely, but technically also possible: https//foo.com/custom/wp/wp-admin/root
		return `${ window.location.protocol }//${ siteFragment.replace(
			'::',
			'/'
		) }/wp-admin/admin.php?page=jetpack#/my-plan`;
	}

	return null;
}

/**
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */
/*
 * sessionStorage key for the guard on the post-checkout reload below. It stores
 * the plan slug the page was rendered with when we last reloaded, so the reload
 * fires at most once per rendered plan (no loop) yet a genuinely new plan can
 * still trigger a fresh reload.
 */
const PLAN_UPGRADED_RELOADED_SLUG_KEY = 'jetpackPlanUpgradedReloadedForSlug';

/*
 * sessionStorage access can throw, not just be undefined: browsers with site
 * data blocked throw a SecurityError on property access, and Safari private mode
 * throws QuotaExceededError from setItem. Optional chaining does not catch a
 * throw, so all access goes through these helpers. They fail safe: an unreadable
 * store reports "already reloaded" and an unwritable store refuses the reload, so
 * a browser that cannot persist the guard never enters a reload loop.
 */
function hasReloadedForPlan( planSlug ) {
	try {
		return window.sessionStorage.getItem( PLAN_UPGRADED_RELOADED_SLUG_KEY ) === planSlug;
	} catch {
		return true;
	}
}

function tryMarkReloadedForPlan( planSlug ) {
	try {
		window.sessionStorage.setItem( PLAN_UPGRADED_RELOADED_SLUG_KEY, planSlug );
		return true;
	} catch {
		return false;
	}
}

function clearReloadedForPlan() {
	try {
		window.sessionStorage.removeItem( PLAN_UPGRADED_RELOADED_SLUG_KEY );
	} catch {
		// Storage unavailable; nothing to clear.
	}
}

/**
 * Decide whether the editor should reload once after returning from a plan upgrade.
 *
 * The editor bakes paid-block availability from the plan cached at render time.
 * If the WordPress.com purchase finished provisioning only after that render, the
 * plan slug the page rendered with differs from the freshly fetched one and gated
 * blocks are stale, so a single reload is warranted. Simple sites gate features
 * live and never need it; the caller enforces the single-attempt guard. See FORMS-712.
 *
 * @param {object}  params                  - Decision inputs.
 * @param {boolean} params.isSimple         - Whether this is a Simple (WordPress.com) site.
 * @param {?string} params.freshPlanSlug    - Plan slug just fetched from the server.
 * @param {?string} params.renderedPlanSlug - Plan slug the editor was rendered with.
 * @param {boolean} params.alreadyReloaded  - Whether a reload was already attempted this return.
 * @return {boolean} True if the editor should reload once.
 */
export function shouldReloadAfterPlanUpgrade( {
	isSimple,
	freshPlanSlug,
	renderedPlanSlug,
	alreadyReloaded,
} ) {
	return (
		! isSimple &&
		!! freshPlanSlug &&
		!! renderedPlanSlug &&
		freshPlanSlug !== renderedPlanSlug &&
		! alreadyReloaded
	);
}

( async () => {
	if ( ! window?.location ) {
		return;
	}

	const queryParams = new URLSearchParams( window.location.search );

	if ( ! queryParams.get( 'plan_upgraded' ) ) {
		// Normal navigation: clear the guard so the next real upgrade can reload.
		clearReloadedForPlan();
		return;
	}

	let planName = null;
	let freshPlanSlug = null;

	try {
		if ( isSimpleSite() ) {
			const siteObj = await apiFetch( {
				path: `/sites/${ parseInt( window?.Jetpack_Editor_Initial_State?.wpcomBlogId ) || 0 }`,
				apiNamespace: 'rest/v1.1',
			} );
			if ( siteObj?.plan ) {
				planName = siteObj.plan.product_name_short;
			}
		} else {
			const jetpackSiteInfo = await apiFetch( { path: '/jetpack/v4/site' } );
			const data = JSON.parse( jetpackSiteInfo.data );

			planName = data.plan.product_name;
			freshPlanSlug = data.plan.product_slug;
		}
	} catch {
		// Ignore fetch/parse failures and fall through to a generic notice.
	}

	/*
	 * The server refreshes the plan on the same request that builds the initial
	 * state (see enqueue_block_editor_assets), so `renderedPlanSlug` already
	 * reflects the new plan and this reload rarely fires. It is a fallback for the
	 * narrow race where WordPress.com finished provisioning between the server
	 * refresh and this client fetch: the freshly fetched slug then differs from
	 * the rendered one, and a single reload re-derives block availability. Simple
	 * sites gate features live and never hit this. `renderedPlanSlug` mirrors the
	 * PHP `$jetpack_plan['product_slug']` injected into Jetpack_Editor_Initial_State.
	 * The slug-keyed guard makes this at most one reload per rendered plan. See FORMS-712.
	 */
	const renderedPlanSlug = window?.Jetpack_Editor_Initial_State?.jetpack?.jetpack_plan?.data;
	if (
		shouldReloadAfterPlanUpgrade( {
			isSimple: isSimpleSite(),
			freshPlanSlug,
			renderedPlanSlug,
			alreadyReloaded: hasReloadedForPlan( renderedPlanSlug ),
		} ) &&
		/*
		 * Only reload if we can persist the one-shot guard first, so a browser
		 * that cannot write sessionStorage falls through to the notice instead of
		 * looping.
		 */
		tryMarkReloadedForPlan( renderedPlanSlug )
	) {
		window.location.reload();
		return;
	}

	const planUrl = getPlanUrl();

	dispatch( 'core/notices' ).createNotice(
		'success',
		planName
			? sprintf(
					/* translators: %s is the plan name, such as Jetpack Premium. */
					__( 'Congratulations! Your site is now on the %s plan.', 'jetpack' ),
					planName
			  )
			: __( 'Congratulations! Your site is now on a paid plan.', 'jetpack' ),
		{
			isDismissible: true,
			...( planUrl && {
				actions: [
					{
						url: getPlanUrl(),
						label: __( 'View my plan', 'jetpack' ),
					},
				],
			} ),
		}
	);
} )();
