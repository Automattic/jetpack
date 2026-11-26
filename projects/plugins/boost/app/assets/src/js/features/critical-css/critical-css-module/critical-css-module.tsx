import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import CriticalCssMeta from '$features/critical-css/critical-css-meta/critical-css-meta';
import Module from '$features/module/module';
import UpgradeNotice from '$features/upgrade-cta/upgrade-notice';
import { recordBoostEvent } from '$lib/utils/analytics';

const CriticalCssModule = () => {
	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );

	const handleCriticalCssLink = () => {
		recordBoostEvent( 'critical_css_link_clicked', {} );
	};

	return (
		<Module
			slug="critical_css"
			title={ __( 'Optimize Critical CSS Loading (manual)', 'jetpack-boost' ) }
			description={
				<p>
					{ createInterpolateElement(
						__(
							'Prioritizes the styles needed to display the visible part of your page first. Also known as <link>Critical CSS</link>.',
							'jetpack-boost'
						),
						{
							link: (
								<Link openInNewTab href={ criticalCssLink } onClick={ handleCriticalCssLink } />
							),
						}
					) }
				</p>
			}
		>
			<CriticalCssMeta />

			<UpgradeNotice
				identifier="critical-css"
				description={ _x(
					'Save time and unlock automatic Critical CSS generation.',
					'',
					'jetpack-boost'
				) }
			/>
		</Module>
	);
};

export default CriticalCssModule;
