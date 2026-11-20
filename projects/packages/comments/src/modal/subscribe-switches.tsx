import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import type { SubscribeSwitchesProps } from './types';

/**
 * The host's subscribe options, as switches.
 *
 * @param props            - Component props.
 * @param props.subscribed - Which are on, by field name.
 * @param props.onChange   - Called with the new set.
 * @return The switches.
 */
export const SubscribeSwitches = ( { subscribed, onChange }: SubscribeSwitchesProps ) => {
	const { formSettings } = useContext( CommentSignals );

	return (
		<>
			{ formSettings.subscriptions.map( ( { name, label } ) => (
				<label key={ name } htmlFor={ name } className="jetpack-comments__toggle">
					<input
						id={ name }
						type="checkbox"
						role="switch"
						checked={ subscribed[ name ] }
						onChange={ event =>
							onChange( { ...subscribed, [ name ]: event.currentTarget.checked } )
						}
					/>
					{ label }
				</label>
			) ) }
		</>
	);
};
