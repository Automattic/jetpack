import { Button } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { getPlainText } from '../utils';

function ParticipantsLabelControl( { className, participants, onDelete } ) {
	return (
		<div className={ `${ className }__participant-control` }>
			{ participants.map( ( { label, slug } ) => (
				<div key={ `${ slug }-key` } className={ `${ className }__participant` }>
					<div className={ `${ className }__participant-label` }>{ getPlainText( label ) }</div>

					<Button
						className={ `${ className }__remove-participant` }
						label={ __( 'Remove participant', 'jetpack' ) }
						onClick={ () => onDelete( slug ) }
						variant="tertiary"
						isSmall
					>
						{ _x( 'Remove', 'verb: remove item from a list', 'jetpack' ) }
					</Button>
				</div>
			) ) }
		</div>
	);
}

export function ParticipantsSelector( { participants, className, onChange, onDelete } ) {
	return (
		<ParticipantsLabelControl
			className={ className }
			participants={ participants }
			onChange={ onChange }
			onDelete={ onDelete }
		/>
	);
}
