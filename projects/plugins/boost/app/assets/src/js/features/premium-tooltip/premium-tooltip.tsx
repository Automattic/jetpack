import React from 'react';
import { __ } from '@wordpress/i18n';
import { Tooltip } from '$features/ui';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './premium-tooltip.module.scss';
import { navigate } from '$lib/utils/navigate';

const PremiumTooltip = () => {
	function showBenefits( event: React.MouseEvent< HTMLAnchorElement > ) {
		event.preventDefault();
		const eventProps = {};
		recordBoostEvent( 'upsell_cta_from_settings_page_tooltip_in_plugin', eventProps );
		navigate( '/upgrade' );
	}
	return (
		<Tooltip title={ __( 'Manual Critical CSS regeneration', 'jetpack-boost' ) }>
			<p className={ styles.paragraph }>
				{ __(
					'Actions that could change your CSS or HTML structure include, but are not limited to:',
					'jetpack-boost'
				) }
			</p>
			<ul className={ styles.list }>
				<li>{ __( 'Making theme changes.', 'jetpack-boost' ) }</li>
				<li>{ __( 'Writing a new post/page.', 'jetpack-boost' ) }</li>
				<li>{ __( 'Editing a post/page.', 'jetpack-boost' ) }</li>
				<li>
					{ __(
						'Activating, deactivating, or updating plugins that will be impacting your site layout or HTML structure.',
						'jetpack-boost'
					) }
				</li>
				<li>
					{ __(
						'Changing settings of plugins that will be impacting your site layout or HTML structure.',
						'jetpack-boost'
					) }
				</li>
				<li>
					{ __(
						'Upgrading your WordPress version if the new release will be including core CSS changes.',
						'jetpack-boost'
					) }
				</li>
			</ul>
			<p className={ `${ styles.paragraph } ${ styles[ 'last-paragraph' ] }` }>
				{ __( 'If you’d like automatic Critical CSS regeneration', 'jetpack-boost' ) }
				<br />
				{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
				<a href="#" onClick={ showBenefits } className={ styles.link }>
					{ __( 'Upgrade now', 'jetpack-boost' ) }
				</a>
			</p>
		</Tooltip>
	);
};

export default PremiumTooltip;
