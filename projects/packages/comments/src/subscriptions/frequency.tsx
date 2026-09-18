import { useEffect, useState } from 'preact/hooks';
import type { Frequency } from '../shared/types';

type FrequencyToggleProps = {
	name: string;
	value: Frequency;
	onChange: ( value: Frequency ) => void;
	disabled?: boolean;
};

const FREQUENCIES: Frequency[] = [ 'instantly', 'daily', 'weekly' ];

const useMediaQuery = ( query: string ) => {
	const [ matches, setMatches ] = useState( () => window.matchMedia( query ).matches );

	useEffect( () => {
		const list = window.matchMedia( query );
		const update = () => setMatches( list.matches );

		update();
		list.addEventListener( 'change', update );

		return () => list.removeEventListener( 'change', update );
	}, [ query ] );

	return matches;
};

export const FrequencyToggle = ( { name, value, onChange, disabled }: FrequencyToggleProps ) => {
	const { strings } = JetpackComments;
	const isNarrow = useMediaQuery( '(max-width: 400px)' );

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
					const checked = frequency === value;

					return (
						<span key={ frequency } className="jetpack-comments__frequency-option">
							<input
								type="radio"
								name={ name }
								id={ id }
								value={ frequency }
								checked={ checked }
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
