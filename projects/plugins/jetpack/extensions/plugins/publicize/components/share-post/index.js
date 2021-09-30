/**
 * WordPress dependencies
 */
import { Button, PanelRow, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { useSharePost } from '../../hooks/use-social-media-connections';

function SharePostButton( { disabled } ) {
	const [ isSharing, setIsSharing ] = useState( false );

	const onPostShareHander = useSharePost( function ( errors ) {
		if ( errors?.length ) {
			// console.error( errors );
		}

		setIsSharing( false );
	} );

	return (
		<Button
			isSecondary
			onClick={ function () {
				setIsSharing( true );
				onPostShareHander();
			} }
			disabled={ disabled || isSharing }
			isBusy={ isSharing }
		>
			{ __( 'Share this post', 'jetpack' ) }
		</Button>
	);
}

export default function SharePostSection() {
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const [ shareOncePublihsed, setShareOncePublished ] = useState( ! isPostPublished );

	return (
		<Fragment>
			<PanelRow>
				<ToggleControl
					label={ __( 'Share once publihsed', 'jetpack' ) }
					onChange={ setShareOncePublished }
					checked={ shareOncePublihsed }
					disabled={ isPostPublished }
				/>
			</PanelRow>

			<PanelRow>
				<SharePostButton disabled={ shareOncePublihsed || ! isPostPublished } />
			</PanelRow>
		</Fragment>
	);
}
