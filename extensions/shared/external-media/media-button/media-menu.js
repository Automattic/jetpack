/**
 * WordPress dependencies
 */
import { Button, MenuItem, MenuGroup, Dropdown, NavigableMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaSources from './media-sources';

function MediaButtonMenu( props ) {
	const { mediaProps, open, setSelectedSource, isFeatured, isReplace } = props;
	const originalComponent = mediaProps.render;

	if ( isFeatured && mediaProps.value === undefined ) {
		return originalComponent( { open } );
	}

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

	return (
		<>
			{ isFeatured && originalComponent( { open } ) }

			<Dropdown
				position="bottom right"
				contentClassName="jetpack-external-media-button-menu__options"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						isTertiary={ ! isFeatured }
						isPrimary={ isFeatured }
						className="jetpack-external-media-button-menu"
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						{ label }
					</Button>
				) }
				renderContent={ () => (
					<NavigableMenu aria-label={ label }>
						<MenuGroup>
							<MenuItem icon="admin-media" onClick={ open }>
								{ __( 'Media Library', 'jetpack' ) }
							</MenuItem>

							<MediaSources open={ open } setSource={ setSelectedSource } />
						</MenuGroup>
					</NavigableMenu>
				) }
			/>
		</>
	);
}

export default MediaButtonMenu;
