import { useRef } from '@wordpress/element';
import clsx from 'clsx';
import { default as WizardMessages } from './wizard-messages';

export default function WizardStep( {
	className = '',
	messages,
	visible,
	onSelect,
	isBusy,
	current,
} ) {
	const stepRef = useRef( null );
	const classes = clsx( 'jetpack-wizard-chat__step', className );
	const stepIsBusy = isBusy && current;

	return (
		visible && (
			<div ref={ stepRef } className={ classes }>
				<WizardMessages messages={ messages } onSelect={ onSelect } isBusy={ stepIsBusy } />
			</div>
		)
	);
}
