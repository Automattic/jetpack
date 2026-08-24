import { __ } from '@wordpress/i18n';
import { Popover } from '@wordpress/ui';
import InfoIcon from '$svg/info';
import styles from './premium-tooltip.module.scss';
import InterstitialModalCTA from '$features/upgrade-cta/interstitial-modal-cta';

const PremiumTooltip = () => {
	return (
		<Popover.Root>
			<Popover.Trigger
				className={ styles[ 'tooltip-trigger' ] }
				aria-label={ __( 'More information', 'jetpack-boost' ) }
			>
				<InfoIcon />
			</Popover.Trigger>
			<Popover.Popup className={ styles.tooltip }>
				<Popover.Title>{ __( 'Manual Critical CSS regeneration', 'jetpack-boost' ) }</Popover.Title>
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

				<div className={ styles[ 'upgrade-cta' ] }>
					<InterstitialModalCTA
						identifier="critical-css-tooltip"
						description={ __( 'Automatic Critical CSS regeneration', 'jetpack-boost' ) }
					/>
				</div>
			</Popover.Popup>
		</Popover.Root>
	);
};

export default PremiumTooltip;
