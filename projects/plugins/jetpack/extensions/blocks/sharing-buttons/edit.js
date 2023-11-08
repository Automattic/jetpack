/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import SharingButtonsContainer from './components/sharing-buttons-container';
import './editor.scss';

function SharingButtonsEdit( {
	attributes,
	className,
	// noticeOperations,
	// noticeUI,
	setAttributes,
} ) {
	/**
	 * Fetch post data from the REST API.
	 */
	const { post } = useSelect( select => {
		const { getCurrentPost } = select( 'core/editor' );
		return {
			post: getCurrentPost(),
		};
	}, [] );

	useEffect( () => {
		setAttributes( { ...attributes, post } );
	}, [ post, setAttributes, attributes ] );

	const handleServiceSelect = service => {
		const { services } = attributes;
		// Remove service from services if present and return
		if ( Array.isArray( services ) && services.includes( service ) ) {
			setAttributes( { ...attributes, services: services.filter( item => item !== service ) } );
			return;
		}

		const updatedServices = Array.isArray( services ) ? [ ...services, service ] : [ service ];
		setAttributes( { ...attributes, services: updatedServices } );
	};

	return (
		<div className={ className }>
			<div className={ `${ className }__block-body` }>
				<SharingButtonsContainer
					selectedServices={ attributes.services || [] }
					onServiceClick={ handleServiceSelect }
				/>
			</div>
		</div>
	);
}

// function Instructions() {
// 	return createInterpolateElement(
// 		__( 'Customize your sharing settings via <a>Jetpack Sharing Settings</a>', 'jetpack' ),
// 		{
// 			a: <a href="/wp-admin/admin.php?page=jetpack#/sharing" target="_blank" />,
// 		}
// 	);
// }

export default SharingButtonsEdit;
