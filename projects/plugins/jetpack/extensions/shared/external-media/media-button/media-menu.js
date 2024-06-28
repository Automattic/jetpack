import { Button, MenuItem, MenuGroup, Dropdown, NavigableMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, media } from '@wordpress/icons';
import { SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE } from '../constants';
import MediaSources from './media-sources';

function MediaButtonMenu( props ) {
	const { mediaProps, open, setSelectedSource, isFeatured, isReplace, hasImage } = props;
	const originalComponent = mediaProps.render;
	let variant = 'tertiary';

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

	if ( isFeatured ) {
		label = __( 'Replace Image', 'jetpack' );
		variant = 'secondary';
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
							variant={ variant }
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
								{ __( 'Media Library', 'jetpack' ) }
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

			<Button
				variant="tertiary"
				className="jetpack-external-media-button-menu"
				aria-haspopup="false"
				onClick={ () => {
					setSelectedSource( SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE );
				} }
			>
				<div className="jetpack-external-media-button-menu__label">
					{ __( 'Generate with AI', 'jetpack' ) }
				</div>
			</Button>
		</>
	);
}

export default MediaButtonMenu;
