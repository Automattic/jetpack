import { Button, MenuItem, MenuGroup, Dropdown, NavigableMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, media } from '@wordpress/icons';
import MediaSources from './media-sources';

/**
 *
 * @param props
 */
function MediaButtonMenu( props ) {
	const { mediaProps, open, setSelectedSource, isFeatured, isReplace, hasImage, hasLargeButtons } =
		props;
	const originalComponent = mediaProps.render;

	if ( isReplace ) {
		return (
			<MediaSources
				originalButton={ originalComponent }
				open={ open }
				setSource={ setSelectedSource }
			/>
		);
	}

	let label = __( 'Select Image', 'jetpack-shared-extension-utils' );

	if ( mediaProps.multiple ) {
		label = __( 'Select Images', 'jetpack-shared-extension-utils' );
	}

	if ( mediaProps.allowedTypes.length > 1 ) {
		label = __( 'Select Media', 'jetpack-shared-extension-utils' );
	}

	if ( isFeatured ) {
		label = __( 'Replace Image', 'jetpack-shared-extension-utils' );
	}

	return (
		<>
			<Dropdown
				placement="bottom-start"
				className="jetpack-external-media-button-menu__dropdown"
				contentClassName="jetpack-external-media-button-menu__options"
				renderToggle={ ( { isOpen, onToggle } ) => {
					// override original button only when it's a simple button with text, or a featured image
					const originalButton = originalComponent && originalComponent( { open: onToggle } );
					if (
						( isFeatured && hasImage ) ||
						( originalButton && typeof originalButton.props.children !== 'string' )
					) {
						return originalButton;
					}
					return (
						<Button
							__next40pxDefaultSize={ hasLargeButtons }
							variant="secondary"
							className="jetpack-external-media-button-menu"
							aria-haspopup="true"
							aria-expanded={ isOpen }
							onClick={ onToggle }
						>
							<div className="jetpack-external-media-button-menu__label">{ label }</div>
							<Icon icon={ media } />
						</Button>
					);
				} }
				renderContent={ ( { onClose } ) => (
					<NavigableMenu aria-label={ label }>
						<MenuGroup>
							<MenuItem
								icon={ media }
								onClick={ () => {
									onClose();
									open();
								} }
							>
								{ __( 'Media Library', 'jetpack-shared-extension-utils' ) }
							</MenuItem>

							<MediaSources
								open={ open }
								setSource={ setSelectedSource }
								onClick={ onClose }
								isFeatured={ isFeatured }
							/>
						</MenuGroup>
					</NavigableMenu>
				) }
			/>
		</>
	);
}

export default MediaButtonMenu;
