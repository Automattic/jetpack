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

	let label = __( 'Select Image', 'jetpack' );

	if ( mediaProps.multiple ) {
		label = __( 'Select Images', 'jetpack' );
	}

	if ( mediaProps.allowedTypes.length > 1 ) {
		label = __( 'Select Media', 'jetpack' );
	}

	const toggle = ( { isOpen, onToggle } ) => {
		const onClick = event => {
			event.stopPropagation();
			onToggle();
		};

		return (
			<Button
				isTertiary={ ! isFeatured }
				isPrimary={ isFeatured }
				className="jetpack-external-media-browse-button"
				aria-haspopup="true"
				aria-expanded={ isOpen }
				onClick={ onClick }
			>
				{ label }
			</Button>
		);
	};

	const content = ( { onToggle } ) => {
		const openMediaLibrary = event => {
			event.stopPropagation();
			openLibrary( onToggle );
		};

		return (
			<NavigableMenu aria-label={ label }>
				<MenuGroup>
					<MenuItem icon="admin-media" onClick={ openMediaLibrary }>
						{ __( 'Media Library', 'jetpack' ) }
					</MenuItem>

					<MediaSources
						open={ () => dropdownOpen( onToggle ) }
						setSource={ source => changeSource( source, onToggle ) }
					/>
				</MenuGroup>
			</NavigableMenu>
		);
	};

	return (
		<>
			{ isFeatured && originalComponent( { open } ) }

			<Dropdown position="bottom right" renderToggle={ toggle } renderContent={ content } />
		</>
	);
}

export default MediaButtonMenu;
