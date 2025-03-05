import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TaskDomainUpsell from './tasks/home-task-domain-upsell';

import './style.scss';

const taskMap = {
	'home-task-domain-upsell': TaskDomainUpsell,
};

export default ( { tasks, ...props } ) => {
	const availableTasks = tasks.filter( _task => taskMap[ _task ] );
	const [ index, setIndex ] = useState( 0 );
	const task = availableTasks[ index ];
	const TaskComponent = taskMap[ task ];

	return (
		<>
			{ availableTasks.length > 1 && (
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
						disabled={ index === availableTasks.length - 1 }
					>
						{ __( 'Next →', 'jetpack-mu-wpcom' ) }
					</button>
				</p>
			) }
			<TaskComponent { ...props } />
		</>
	);
};
