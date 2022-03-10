/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * React hook that returns the site logo data.
 *
 * @returns {object} Site Logo object data.
 */
export default function useSiteLogo() {
	const { id, mediaItemData } = useSelect( select => {
		const { canUser, getEntityRecord, getEditedEntityRecord } = select( coreStore );
		const siteSettings = getEditedEntityRecord( 'root', 'site' );
		const siteData = getEntityRecord( 'root', '__unstableBase' );
		const siteLogo = siteSettings?.site_logo;
		const readOnlyLogo = siteData?.site_logo;
		const canUserEdit = canUser( 'update', 'settings' );
		const siteLogoId = canUserEdit ? siteLogo : readOnlyLogo;
		const mediaItem =
			siteLogoId &&
			select( coreStore ).getMedia( siteLogoId, {
				context: 'view',
			} );

		return {
			id: siteLogoId,
			mediaItemData: mediaItem && {
				mediaId: mediaItem.id,
				url: mediaItem.source_url,
				alt: mediaItem.alt_text,
			},
		};
	}, [] );

	return { id, ...mediaItemData };
}
