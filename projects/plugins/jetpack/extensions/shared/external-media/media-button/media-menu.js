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
	const { mediaProps, open, setSelectedSource, isFeatured, isReplace } = props;
	const originalComponent = mediaProps.render;
	const featuredImageIsSelected = isFeatured && mediaProps.value > 0;
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

	if ( isFeatured && featuredImageIsSelected ) {
		label = __( 'Replace Image', 'jetpack' );
		isPrimary = false;
		isTertiary = false;
		extraProps.isSecondary = true;
	}

	return (
		<>
			{ isFeatured && originalComponent( { open } ) }

			<Dropdown
				position="bottom right"
				contentClassName="jetpack-external-media-button-menu__options"
				renderToggle={ ( { isOpen, onToggle } ) => (
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
				) }
				renderContent={ () => (
					<NavigableMenu aria-label={ label }>
						<MenuGroup>
							<MenuItem icon={ media } onClick={ open }>
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
