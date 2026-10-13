import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Link, Notice, Stack } from '@wordpress/ui';

interface SeoHostingData {
	seo?: { hosting_options_url?: string };
}

/**
 * Explain platform ownership without claiming that a public sitemap is available.
 *
 * @return The Simple sitemap notice.
 */
export default function PlatformSitemapNotice() {
	const hostingOptionsUrl = ( getScriptData() as SeoHostingData )?.seo?.hosting_options_url;

	return (
		<Notice.Root intent="info">
			<Stack direction="column" gap="sm">
				<Notice.Description>
					{ __(
						'WordPress.com manages sitemap generation for this site. Additional hosting features let you turn sitemap generation on or off.',
						'jetpack-seo'
					) }
				</Notice.Description>
				{ hostingOptionsUrl && (
					<Link href={ hostingOptionsUrl } openInNewTab rel="noopener noreferrer">
						{ __( 'Explore hosting options', 'jetpack-seo' ) }
					</Link>
				) }
			</Stack>
		</Notice.Root>
	);
}
