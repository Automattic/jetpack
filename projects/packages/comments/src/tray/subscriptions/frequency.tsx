import { useEffect, useState } from 'preact/hooks';
import type { Frequency } from './types';

type FrequencyToggleProps = {
	name: string;
	value: Frequency;
	onChange: ( value: Frequency ) => void;
	disabled?: boolean;
};

const FREQUENCIES: Frequency[] = [ 'instantly', 'daily', 'weekly' ];

const NARROW = '(max-width: 400px)';

export const FrequencyToggle = ( { name, value, onChange, disabled }: FrequencyToggleProps ) => {
	const { strings } = JetpackComments;
	const [ isNarrow, setIsNarrow ] = useState( () => window.matchMedia( NARROW ).matches );

	useEffect( () => {
		const list = window.matchMedia( NARROW );
		const update = () => setIsNarrow( list.matches );

		list.addEventListener( 'change', update );

		return () => list.removeEventListener( 'change', update );
	}, [] );

	if ( isNarrow ) {
		return (
			<select
				className="jetpack-comments__frequency-select"
				value={ value }
				title={ strings.emailNewPosts }
				disabled={ disabled }
				onChange={ event => onChange( event.currentTarget.value as Frequency ) }
			>
				{ FREQUENCIES.map( frequency => (
					<option key={ frequency } value={ frequency }>
						{ strings[ frequency ] }
					</option>
				) ) }
			</select>
		);
	}

	return (
		<div className="jetpack-comments__frequency">
			<fieldset className="jetpack-comments__frequency-group" disabled={ disabled }>
				<legend className="jetpack-comments__visually-hidden">{ strings.emailNewPosts }</legend>
				{ FREQUENCIES.map( frequency => {
					const id = `${ name }-${ frequency }`;

					return (
						<span key={ frequency } className="jetpack-comments__frequency-option">
							<input
								type="radio"
								name={ name }
								id={ id }
								value={ frequency }
								checked={ frequency === value }
								disabled={ disabled }
								onChange={ () => onChange( frequency ) }
							/>
							<label htmlFor={ id }>
								<span>{ strings[ frequency ] }</span>
							</label>
						</span>
					);
				} ) }
			</fieldset>
		</div>
	);
};
