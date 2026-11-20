import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import { ButtonLink, Stack, Text } from '@wordpress/ui';
import { CardRow } from '../../components/card';
import { recordEvent, recordViewOnce } from '../../data/tracks';

type Props = {
	/** What the free plan leaves out, such as "Malware scanning". */
	title: string;
	/** What that means for this site. */
	description: string;
	/** Where to buy Scan. */
	url: string;
	/** Tracks event prefix; `_view` and `_click` are recorded with `eventProps`. */
	event: string;
	eventProps?: Record< string, string | number >;
};

/**
 * A card row naming protection the site is missing without Scan, with a link to upgrade.
 *
 * @param props             - Component props.
 * @param props.title       - What the free plan leaves out.
 * @param props.description - What that means for this site.
 * @param props.url         - Where to buy Scan.
 * @param props.event       - Tracks event prefix.
 * @param props.eventProps  - Tracks event properties.
 * @return The row.
 */
export default function UpgradeGap( { title, description, url, event, eventProps = {} }: Props ) {
	useEffect( () => recordViewOnce( `${ event }_view`, eventProps ) );

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
				<ButtonLink
					href={ url }
					size="compact"
					className="jp-protect-upgrade-gap__link"
					// eslint-disable-next-line react/jsx-no-bind -- ButtonLink isn't memoized, so a stable handler buys nothing.
					onClick={ () => recordEvent( `${ event }_click`, eventProps ) }
				>
					{ __( 'Upgrade', 'jetpack-protect-pkg' ) }
				</ButtonLink>
			</Stack>
		</CardRow>
	);
}
