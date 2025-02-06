import { Button, Gridicon, getProductCheckoutUrl } from '@automattic/jetpack-components';
import { ExternalLink, Popover } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement, useCallback, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import useAnalytics from '../../../hooks/useAnalytics';
import { STORE_ID } from '../../../store';
import './style.scss';

const StorageHelpPopover = ( { className, forecastInDays } ) => {
	const STORAGE_USAGE_HELP_POPOVER_STATE_KEY = 'storage_usage_help_popover_state';
	const popoverState = null === localStorage.getItem( STORAGE_USAGE_HELP_POPOVER_STATE_KEY );
	const [ isPopoverVisible, setPopoverVisible ] = useState( popoverState );
	const addonSlug = useSelect( select => select( STORE_ID ).getStorageAddonOfferSlug() );
	const siteSlug = useSelect( select => select( STORE_ID ).getCalypsoSlug() );
	const adminUrl = useSelect( select => select( STORE_ID ).getSiteData().adminUrl );

	const popover = useRef( null );

	const { tracks } = useAnalytics();
	const trackUpgradeStorageClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_upgrade_storage_prompt_from_popover_cta', {
			site: siteSlug,
		} );
	}, [ tracks, siteSlug ] );

	const toggleHelpPopover = useCallback(
		event => {
			setPopoverVisible( ! isPopoverVisible );
			localStorage.setItem( STORAGE_USAGE_HELP_POPOVER_STATE_KEY, 'shown' );
			// when the info popover inside a button, we don't want clicking it to propagate up
			event.stopPropagation();
		},
		[ isPopoverVisible ]
	);

	if ( ! forecastInDays ) {
		return null;
	}

	const storageUpgradeUrl = getProductCheckoutUrl(
		addonSlug,
		siteSlug,
		`${ adminUrl }admin.php?page=jetpack-backup`,
		true
	);

	const forecastStatement = sprintf(
		/* translators: %d: is number of days of the forecast */
		_n(
			'Based on the current size of your site, Jetpack will save <strong>%d day of full backup</strong>.',
			'Based on the current size of your site, Jetpack will save <strong>%d days of full backups</strong>.',
			forecastInDays,
			'jetpack-backup-pkg'
		),
		forecastInDays
	);
	return (
		<span className={ className }>
			<Button
				size="small"
				variant="tertiary"
				className="backup-storage-space__toggle-popover"
				onClick={ toggleHelpPopover }
				ref={ popover }
			>
				<Gridicon icon="info-outline" size={ 20 } />
			</Button>
			{ isPopoverVisible && (
				<Popover
					className="backup-storage-space__popover"
					position="bottom right"
					context={ popover.current }
					noArrow={ false }
				>
					<h3> { __( 'Backup archive size', 'jetpack-backup-pkg' ) }</h3>
					<p>
						{ createInterpolateElement( forecastStatement, {
							strong: <strong />,
						} ) }
						<Button
							size="small"
							variant="tertiary"
							className="backup-storage-space__close-popover"
							onClick={ toggleHelpPopover }
						>
							<Gridicon icon="cross" size={ 18 } />
						</Button>
					</p>
					<p>
						{ createInterpolateElement(
							__(
								'If you need more backup days, try <link>reducing the backup size</link> or adding more storage.',
								'jetpack-backup-pkg'
							),
							{
								link: (
									<ExternalLink href="https://jetpack.com/support/backup/jetpack-vaultpress-backup-storage-and-retention/#reduce-storage-size" />
								),
							}
						) }
					</p>
					<div className="backup-storage-space__button-section">
						<Button
							variant="primary"
							href={ storageUpgradeUrl }
							onClick={ trackUpgradeStorageClick }
						>
							{ __( 'Add more storage', 'jetpack-backup-pkg' ) }
						</Button>
					</div>
				</Popover>
			) }
		</span>
	);
};

export default StorageHelpPopover;
