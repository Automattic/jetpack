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

	const dropdownOpen = onToggle => {
		onToggle();
		open();
	};
	const changeSource = ( source, onToggle ) => {
		setSelectedSource( source );
		onToggle();
	};
	const openLibrary = onToggle => {
		onToggle();
		open();
	};

	const label =
		mediaProps.allowedTypes.length > 1
			? __( 'Select Media', 'jetpack' )
			: __( 'Select Image', 'jetpack' );

	return (
		<>
			{ isFeatured && originalComponent( { open } ) }

			<Dropdown
				position="bottom right"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						isTertiary={ ! isFeatured }
						isPrimary={ isFeatured }
						className="jetpack-external-media-browse-button"
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						{ label }
					</Button>
				) }
				renderContent={ ( { onToggle } ) => (
					<NavigableMenu aria-label={ label }>
						<MenuGroup>
							<MenuItem icon="admin-media" onClick={ () => openLibrary( onToggle ) }>
								{ __( 'Media Library', 'jetpack' ) }
							</MenuItem>

							<MediaSources
								open={ () => dropdownOpen( onToggle ) }
								setSource={ source => changeSource( source, onToggle ) }
							/>
						</MenuGroup>
					</NavigableMenu>
				) }
			/>
		</>
	);
}

export default MediaButtonMenu;
