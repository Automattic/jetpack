/**
 * WordPress dependencies
 */
import { Button, MenuItem, MenuGroup, Dropdown, NavigableMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { media } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MediaSources from './media-sources';

function MediaButtonMenu( props ) {
	const { mediaProps, open, setSelectedSource, isFeatured, isReplace } = props;
	const originalComponent = mediaProps.render;

	const meta = useSelect( select => select( 'core/editor' ).getCurrentPostAttribute( 'meta' ), [] );
	const { jetpack_anchor_track: track } = meta;

	function setPodcastEpisodeCover( ...args ) {
		if ( ! track ) {
			return;
		}

		const dataTrack = JSON.parse( track );
		if ( !dataTrack?.image ) {
			return;
		}
	}

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
							<MenuItem icon={ media } onClick={ open }>
								{ __( 'Media Library', 'jetpack' ) }
							</MenuItem>

							<MediaSources open={ open } setSource={ setSelectedSource } />

							{ track && (
								<MenuItem icon="microphone" onClick={ setPodcastEpisodeCover }>
									{ __( 'Podcast episode cover', 'jetpack' ) }
								</MenuItem>
							) }
						</MenuGroup>
					</NavigableMenu>
				) }
			/>
		</>
	);
}

export default MediaButtonMenu;
