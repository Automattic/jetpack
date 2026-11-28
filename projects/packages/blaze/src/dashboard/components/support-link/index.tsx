import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { localizeUrl } from '../../compat/utils';
import type { ReactNode } from 'react';

const ADVERTISING_SUPPORT_URL = 'https://wordpress.com/support/promote-a-post/';

type Props = {
	href?: string;
	children?: ReactNode;
};

/**
 * A link to Blaze Ads support docs, opening in a new tab.
 *
 * @param props          - Props.
 * @param props.href     - Support URL; defaults to the Blaze Ads guide.
 * @param props.children - Link text; defaults to "Learn more".
 * @return The link.
 */
export default function SupportLink( { href = ADVERTISING_SUPPORT_URL, children }: Props ) {
	return (
		<Link href={ localizeUrl( href ) } openInNewTab>
			{ children ?? __( 'Learn more', 'jetpack-blaze' ) }
		</Link>
	);
}
