/**
 * External dependencies
 */
import { createRoot } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ImportSubscribersModal from './components/import-subscribers-modal.tsx';
import './style.module.scss';

export const JetpackSubscribers = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	return (
		<div className="jetpack-subscribers-dashboard-page">
			<div className="jetpack-subscribers-dashboard-page__header">
				<h1>{ __( 'Subscribers', 'jetpack-subscribers-dashboard' ) }</h1>
				<Button
					variant="primary"
					onClick={ () => setIsModalOpen( true ) }
				>
					{ __( 'Add Subscribers', 'jetpack-subscribers-dashboard' ) }
				</Button>
			</div>
			
			<div className="jetpack-subscribers-dashboard-page__content">
				<p>{ __( 'Manage your site subscribers here.', 'jetpack-subscribers-dashboard' ) }</p>
			</div>

			<ImportSubscribersModal
				isOpen={ isModalOpen }
				onRequestClose={ () => setIsModalOpen( false ) }
			/>
		</div>
	);
};

/**
 * The initial renderer function.
 */
async function render() {
	const container = document.getElementById( 'jetpack-subscribers-dashboard' );
	if ( null === container ) {
		return;
	}
	createRoot( container ).render( <JetpackSubscribers /> );
}

render();
