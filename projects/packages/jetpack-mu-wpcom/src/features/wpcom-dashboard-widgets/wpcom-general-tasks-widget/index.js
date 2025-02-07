import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TaskDomainUpsell from './tasks/home-task-domain-upsell';

import './style.scss';

const taskMap = {
	'home-task-domain-upsell': TaskDomainUpsell,
};

export default ( { tasks } ) => {
	const [ index, setIndex ] = useState( 0 );
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
			{ TaskComponent ? <TaskComponent /> : <p style={ { minHeight: '180px' } }>[{ task }]</p> }
		</>
	);
};
