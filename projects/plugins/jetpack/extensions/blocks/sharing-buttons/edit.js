import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { store } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { SharingBlockPlaceholder } from './components/sharing-block-placeholder';
import { SharingBlockSkeletonLoader } from './components/sharing-block-skeleton-loader';
import SharingButtonsContainer from './components/sharing-buttons-container';
import './editor.scss';

function SharingButtonsEdit( {
	attributes,
	className,
	post,
	setAttributes,
	disableOriginalSharing,
} ) {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'sharedaddy' );

	useEffect( () => {
		setAttributes( { ...attributes, post } );
		disableOriginalSharing();
	}, [ post, setAttributes, attributes, disableOriginalSharing ] );

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

	if ( ! isModuleActive ) {
		if ( isLoadingModules ) {
			return <SharingBlockSkeletonLoader />;
		}

		return (
			<SharingBlockPlaceholder
				changeStatus={ changeStatus }
				isModuleActive={ isModuleActive }
				isLoading={ isChangingStatus }
			/>
		);
	}

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

export default compose( [
	withSelect( select => {
		return {
			post: select( store ).getCurrentPost(),
		};
	} ),
	withDispatch( dispatch => {
		const { editPost } = dispatch( store );

		return {
			disableOriginalSharing: () => editPost( { jetpack_sharing_enabled: false } ),
		};
	} ),
] )( SharingButtonsEdit );
SharingButtonsEdit;
