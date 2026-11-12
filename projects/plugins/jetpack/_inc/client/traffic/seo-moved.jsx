import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';

/**
 * Search result that sends the SEO, sitemap and site verification settings to the SEO page.
 *
 * @return {import('react').ReactNode} The card.
 */
export const SeoMoved = () => (
	<PointerCard
		header={ __( 'SEO', 'jetpack' ) }
		href={ getAdminUrl( 'admin.php?page=jetpack-seo' ) }
		linkText={ __( 'Open the SEO settings', 'jetpack' ) }
	>
		<p>
			{ __(
				'The SEO, sitemap and site verification settings are now in Jetpack › SEO.',
				'jetpack'
			) }
		</p>
	</PointerCard>
);
