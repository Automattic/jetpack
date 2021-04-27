/**
 * WordPress dependencies
 */
import { Button, MenuItem, MenuGroup, Dropdown, NavigableMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { media } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaSources from './media-sources';

function MediaButtonMenu( props ) {
	const { mediaProps, open, setSelectedSource, isFeatured, isReplace, hasImage } = props;
	const originalComponent = mediaProps.render;
	let isPrimary = isFeatured;
	let isTertiary = ! isFeatured;
	const extraProps = {};

	if ( isReplace ) {
		return (
			<MediaSources
				originalButton={ originalComponent }
				open={ open }
				setSource={ setSelectedSource }
			/>
		);
	}

	let label = __( 'Select Image', 'jetpack' );

	if ( mediaProps.multiple ) {
		label = __( 'Select Images', 'jetpack' );
	}

	if ( mediaProps.allowedTypes.length > 1 ) {
		label = __( 'Select Media', 'jetpack' );
	}

	if ( isFeatured && hasImage ) {
		label = __( 'Replace Image', 'jetpack' );
		isPrimary = false;
		isTertiary = false;
		extraProps.isSecondary = true;
	}

	return (
		<>
			{ isFeatured && hasImage && originalComponent( { open } ) }

			<Dropdown
				position="bottom right"
				contentClassName="jetpack-external-media-button-menu__options"
				renderToggle={ ( { isOpen, onToggle } ) =>
					// Featured image: when there's no image set, wrap the component, as it's already a (giant) button,
					// there's no need to add a second button.
					isFeatured && ! hasImage ? (
						originalComponent( { open: onToggle } )
					) : (
						<Button
							isTertiary={ isTertiary }
							isPrimary={ isPrimary }
							className="jetpack-external-media-button-menu"
							aria-haspopup="true"
							aria-expanded={ isOpen }
							onClick={ onToggle }
							{ ...extraProps }
						>
							{ label }
						</Button>
					)
				}
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
								{ __( 'Media Library', 'jetpack' ) }
							</MenuItem>

							<MediaSources open={ open } setSource={ setSelectedSource } onClick={ onClose } />
						</MenuGroup>
					</NavigableMenu>
				) }
			/>
		</>
	);
}

export default MediaButtonMenu;
