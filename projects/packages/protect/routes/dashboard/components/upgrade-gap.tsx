import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import { ButtonLink, Stack, Text } from '@wordpress/ui';
import { CardRow } from './card';

type Props = {
	/** What the free plan leaves out, such as "Malware scanning". */
	title: string;
	/** What that means for this site. */
	description: string;
	/** Where to buy Scan. */
	url: string;
};

/**
 * A card row naming protection the site is missing without Scan, with a link to upgrade.
 *
 * @param props             - Component props.
 * @param props.title       - What the free plan leaves out.
 * @param props.description - What that means for this site.
 * @param props.url         - Where to buy Scan.
 * @return The row.
 */
export default function UpgradeGap( { title, description, url }: Props ) {
	return (
		<CardRow className="jp-protect-upgrade-gap">
			<Stack direction="row" gap="md" align="center" justify="space-between">
				<Stack direction="row" gap="sm" align="start">
					<Icon icon={ closeSmall } size={ 24 } className="jp-protect-upgrade-gap__icon" />
					<Stack direction="column" gap="xs">
						<Text variant="body-md" className="jp-protect-upgrade-gap__title">
							{ title }
						</Text>
						<Text variant="body-sm" className="jp-protect-card__muted">
							{ description }
						</Text>
					</Stack>
				</Stack>
				<ButtonLink href={ url } size="compact" className="jp-protect-upgrade-gap__link">
					{ __( 'Upgrade', 'jetpack-protect-pkg' ) }
				</ButtonLink>
			</Stack>
		</CardRow>
	);
}
