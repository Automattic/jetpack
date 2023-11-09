import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { store } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { SharingBlockPlaceholder } from './components/sharing-block-placeholder';
import { SharingBlockSkeletonLoader } from './components/sharing-block-skeleton-loader';
import SharingButtonsContainer from './components/sharing-buttons-container';

function SharingButtonsEdit( { attributes, className, post, setAttributes } ) {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'sharedaddy' );

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

export default compose( [
	withSelect( select => {
		return {
			post: select( store ).getCurrentPost(),
		};
	} ),
] )( SharingButtonsEdit );
