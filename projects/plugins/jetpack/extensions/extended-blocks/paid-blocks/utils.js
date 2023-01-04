import analytics from '../../../_inc/client/lib/analytics';

/**
 * Record event helper.
 * Use it when the user clicks on the upgrade banner button.
 *
 * @param { object } props - Event properties.
 * @param { string } props.plan -      Plan slug.
 * @param { string } props.blockName - Block name where the banner is mounted.
 * @param { string } props.context -   Banner context: sidebar, editor.
 * @returns { Function }               Rector event helper function.
 */
export const trackUpgradeClickEvent = ( { plan, blockName, context } ) =>
	void analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_click', {
		plan,
		block: blockName,
		context,
	} );

/**
 * Record event helper.
 * Use it when the banner shows up in the block editor canvas.
 *
 * @param { object } props - Event properties.
 * @param { string } props.plan -      Plan slug.
 * @param { string } props.blockName - Block name where the banner is mounted.
 * @param { string } props.context -   Banner context: sidebar, editor.
 * @returns { Function }               Rector event helper function.
 */
export const trackUpgradeBannerImpression = ( { plan, blockName, context } ) =>
	void analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_banner_impression', {
		plan,
		block: blockName,
		context,
	} );
