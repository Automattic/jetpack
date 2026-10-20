import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { published, rotateRight, shield } from '@wordpress/icons';
import FeatureUpsell from '../../components/feature-upsell';
import recordEvent from '../../data/tracks';
import type { TracksUser } from '../../data/tracks';

/**
 * The free plan's Firewall upsell: the automatic rules Scan adds.
 *
 * @param props            - Component props.
 * @param props.url        - Where to buy Scan.
 * @param props.tracksUser - Who to record views and clicks as.
 * @return The card row.
 */
export default function FirewallUpsell( {
	url,
	tracksUser,
}: {
	url: string;
	tracksUser: TracksUser;
} ) {
	useEffect( () => {
		recordEvent( tracksUser, 'jetpack_protect_dashboard_firewall_upsell_view' );
	}, [ tracksUser ] );

	const onClick = useCallback(
		() => recordEvent( tracksUser, 'jetpack_protect_dashboard_firewall_upsell_click' ),
		[ tracksUser ]
	);

	return (
		<FeatureUpsell
			heading={ __( 'Let your firewall keep up with new attacks', 'jetpack-protect-pkg' ) }
			features={ [
				[
					shield,
					__( 'Block new attacks', 'jetpack-protect-pkg' ),
					__(
						'Automatic rules stop known attacks on WordPress, plugins and themes.',
						'jetpack-protect-pkg'
					),
				],
				[
					rotateRight,
					__( 'Always up to date', 'jetpack-protect-pkg' ),
					__(
						'New rules arrive as new attacks are found. You don’t update a thing.',
						'jetpack-protect-pkg'
					),
				],
				[
					published,
					__( 'Nothing to set up', 'jetpack-protect-pkg' ),
					__( 'Turn it on once and it works in the background.', 'jetpack-protect-pkg' ),
				],
			] }
			button={ __( 'Upgrade', 'jetpack-protect-pkg' ) }
			url={ url }
			onClick={ onClick }
		/>
	);
}
