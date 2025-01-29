import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TaskDomainUpsell from './tasks/home-task-domain-upsell';

import './style.scss';

const taskMap = {
	'home-task-domain-upsell': TaskDomainUpsell,
};

export default ( { siteId } ) => {
	const [ response, setResponse ] = useState( [] );
	const [ index, setIndex ] = useState( 0 );

	useEffect( () => {
		const path = `/wpcom/v2/sites/${ siteId }/home/layout`;
		apiFetch( { path } ).then( setResponse );
	}, [ siteId ] );

	if ( ! Array.isArray( response?.secondary ) ) {
		return null;
	}

	// The secondary array countains strings that refer to cards, except for the
	// tasks which is an array.
	const tasks = response.secondary.find( item => Array.isArray( item ) );

	if ( ! tasks ) {
		return <p>{ __( 'No suggestions.', 'jetpack-mu-wpcom' ) }</p>;
	}

	const task = tasks[ index ];
	const TaskComponent = taskMap[ task ];

	return (
		<>
			<p className="wpcom_general_tasks_widget_buttons">
				<button
					className="button button-link"
					onClick={ () => setIndex( index - 1 ) }
					disabled={ index === 0 }
				>
					{ __( '← Previous', 'jetpack-mu-wpcom' ) }
				</button>
				{ ' ' }
				<button
					className="button button-link"
					onClick={ () => setIndex( index + 1 ) }
					disabled={ index === tasks.length - 1 }
				>
					{ __( 'Next →', 'jetpack-mu-wpcom' ) }
				</button>
			</p>
			{ TaskComponent ? (
				<TaskComponent />
			) : (
				<p style={ { minHeight: '180px' } }>To do: { task }</p>
			) }
			{ /* { createPortal(
				<span className="wpcom_general_tasks_widget_buttons">
					<button
						className="button button-link"
						onClick={ event => {
							event.preventDefault();
							event.stopPropagation();
							setIndex( index - 1 );
						} }
						disabled={ index === 0 }
					>
						{ __( '← Previous', 'jetpack-mu-wpcom' ) }
					</button>
					<button
						className="button button-link"
						onClick={ event => {
							event.preventDefault();
							event.stopPropagation();
							setIndex( index + 1 );
						} }
						disabled={ index === tasks.length - 1 }
					>
						{ __( 'Next →', 'jetpack-mu-wpcom' ) }
					</button>
				</span>,
				document.querySelector( '#wpcom_general_tasks_widget .wpcom_general_tasks_widget_title' )
			) } */ }
		</>
	);
};
