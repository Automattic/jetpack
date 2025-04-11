/**
 * Internal dependencies
 */
import wpcomLimitedRequest from './wpcom-limited-request.ts';
/**
 * Types
 */
import type { SetSiteLogoProps, SetSiteLogoResponseProps } from '../types.ts';

/**
 * Set the site logo using a backend request.
 *
 * @param {SetSiteLogoProps}         setSiteLogoProps         - The properties to set the site logo
 * @param {SetSiteLogoProps.siteId}  setSiteLogoProps.siteId  - The site ID
 * @param {SetSiteLogoProps.imageId} setSiteLogoProps.imageId - The image ID to set as the site logo
 * @return {Promise<SetSiteLogoResponseProps>} The response from the request
 */
export async function setSiteLogo( { siteId, imageId }: SetSiteLogoProps ) {
	const body = {
		site_logo: imageId,
		site_icon: imageId,
	};

	return wpcomLimitedRequest< SetSiteLogoResponseProps >( {
		path: `/sites/${ String( siteId ) }/settings`,
		apiVersion: 'v2',
		apiNamespace: 'wp/v2',
		body,
		query: 'source=jetpack-ai',
		method: 'POST',
	} );
}
