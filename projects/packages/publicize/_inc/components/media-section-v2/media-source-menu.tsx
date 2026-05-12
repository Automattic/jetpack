/**
 * MediaSourceMenu component
 * Displays a dropdown menu with grouped media source options
 */

import { Button, Dropdown, MenuGroup } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import MediaSourceMenuItem from './media-source-menu-item';
import styles from './styles.module.scss';
import { MediaSourceMenuProps } from './types';
import { getMediaSourceOptions } from './utils/media-source-options';

/**
 * MediaSourceMenu component
 *
 * @param {MediaSourceMenuProps} props - Component props
 * @return {JSX.Element} MediaSourceMenu component
 */
export default function MediaSourceMenu( {
	currentSource,
	onSelect,
	onMediaLibraryClick,
	onAiImageClick,
	disabled = false,
	featuredImageId,
	includeDefaultOption = false,
	children,
}: MediaSourceMenuProps ) {
	// Get options from function to ensure translations are loaded
	const options = useMemo( () => getMediaSourceOptions(), [] );

	/*
	 * Group options for display:
	 * - Hide "Featured image" when no featured image exists.
	 * - Hide "Default" unless the caller opts in (per-network customization only).
	 * - In per-network mode, SIG and Featured image are always attached (no toggle to make
	 *   them link-preview-only), so they're surfaced under "Attachment". Default is the only
	 *   link-preview option.
	 */
	const linkPreviewOptions = useMemo(
		() =>
			options.filter( opt => {
				if ( opt.id === 'featured-image' && ! featuredImageId ) return false;
				if ( includeDefaultOption ) {
					return opt.id === null;
				}
				if ( opt.id === null ) return false;
				return opt.group === 'link-preview';
			} ),
		[ options, featuredImageId, includeDefaultOption ]
	);
	const attachmentOptions = useMemo(
		() =>
			options.filter( opt => {
				if ( opt.id === null ) return false;
				if ( opt.id === 'featured-image' && ! featuredImageId ) return false;
				if ( includeDefaultOption ) {
					return true;
				}
				return opt.group === 'attachment';
			} ),
		[ options, featuredImageId, includeDefaultOption ]
	);

	const renderToggle = useCallback(
		( { isOpen, onToggle }: { isOpen: boolean; onToggle: () => void } ) => (
			<>
				{ ! children && (
					<Button
						__next40pxDefaultSize
						className={ styles.selectButton }
						variant="secondary"
						onClick={ onToggle }
						aria-expanded={ isOpen }
						disabled={ disabled }
					>
						{ __( 'Select', 'jetpack-publicize-pkg' ) }
					</Button>
				) }
				{ children && children( { open: onToggle } ) }
			</>
		),
		[ children, disabled ]
	);

	const renderContent = useCallback(
		( { onClose }: { onClose: () => void } ) => (
			<>
				<MenuGroup
					label={ _x(
						'Link preview',
						'The image source to use for post link preview on social media.',
						'jetpack-publicize-pkg'
					) }
				>
					{ linkPreviewOptions.map( option => (
						<MediaSourceMenuItem
							key={ option.id ?? 'default' }
							option={ option }
							isSelected={ currentSource === option.id }
							onSelect={ onSelect }
							onClose={ onClose }
						/>
					) ) }
				</MenuGroup>
				<MenuGroup
					label={ _x(
						'Attachment',
						'The media source to use for post attachment on social media.',
						'jetpack-publicize-pkg'
					) }
				>
					{ attachmentOptions.map( option => (
						<MediaSourceMenuItem
							key={ option.id ?? 'default' }
							option={ option }
							isSelected={ currentSource === option.id }
							onSelect={ onSelect }
							onClose={ onClose }
							onMediaLibraryClick={ onMediaLibraryClick }
							onAiImageClick={ onAiImageClick }
						/>
					) ) }
				</MenuGroup>
			</>
		),
		[
			linkPreviewOptions,
			attachmentOptions,
			currentSource,
			onSelect,
			onMediaLibraryClick,
			onAiImageClick,
		]
	);

	return (
		<Dropdown
			className={ styles.dropdownMenu }
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ renderToggle }
			renderContent={ renderContent }
		/>
	);
}
