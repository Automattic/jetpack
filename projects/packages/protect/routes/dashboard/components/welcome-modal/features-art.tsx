import { __ } from '@wordpress/i18n';
import { Icon, key } from '@wordpress/icons';
import shieldFlame from '../../sections/firewall/icon';
import gauge from '../../sections/monitor/icon';
import './features-art.scss';
import type { CSSProperties, ReactElement } from 'react';

/**
 * The tools that joined Scan in Protect, in the dashboard's card order.
 *
 * @return Icon and name for each.
 */
const getBundledFeatures = () => [
	{ icon: gauge, name: __( 'Downtime monitoring', 'jetpack-protect-pkg' ) },
	{ icon: shieldFlame, name: __( 'Firewall', 'jetpack-protect-pkg' ) },
	{ icon: key, name: __( 'Login protection', 'jetpack-protect-pkg' ) },
];

/**
 * Header art for the guide's last page: a settings card whose toggles flip on one by one, once.
 *
 * @return The art.
 */
export default function FeaturesArt(): ReactElement {
	return (
		<span className="jp-protect-features-art">
			<span className="jp-protect-features-art__card">
				{ getBundledFeatures().map( ( feature, i ) => (
					<span
						key={ feature.name }
						className="jp-protect-features-art__row"
						style={ { '--i': i } as CSSProperties }
					>
						<Icon icon={ feature.icon } size={ 24 } />
						<span className="jp-protect-features-art__name">{ feature.name }</span>
						<span className="jp-protect-features-art__switch">
							<span className="jp-protect-features-art__thumb" />
						</span>
					</span>
				) ) }
			</span>
		</span>
	);
}
