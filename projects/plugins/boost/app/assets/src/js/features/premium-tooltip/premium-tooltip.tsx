import { IconTooltip } from '@automattic/jetpack-components';
import React from 'react';
import { __ } from '@wordpress/i18n';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './premium-tooltip.module.scss';
import { useNavigate } from 'react-router-dom';

const PremiumTooltip = () => {
	const navigate = useNavigate();

	function showBenefits( event: React.MouseEvent< HTMLAnchorElement > ) {
		event.preventDefault();
		const eventProps = {};
		recordBoostEvent( 'upsell_cta_from_settings_page_tooltip_in_plugin', eventProps );
		navigate( '/upgrade' );
	}
	return (
		<IconTooltip
			title={ __( 'Manual Critical CSS regeneration', 'jetpack-boost' ) }
			placement={ 'bottom' }
			className={ styles.tooltip }
			iconSize={ 22 }
			wide={ true }
			offset={ 12 }
		>
			{ __(
				'Actions that could change your CSS or HTML structure include, but are not limited to:',
				'jetpack-boost'
			) }
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
			{ __( 'If you’d like automatic Critical CSS regeneration', 'jetpack-boost' ) }
			<br />
			{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
			<a href="#" onClick={ showBenefits }>
				{ __( 'Upgrade now', 'jetpack-boost' ) }
			</a>
		</IconTooltip>
	);
};

export default PremiumTooltip;
