import { useState, useEffect } from 'preact/hooks';
import { translate } from '../i18n';
import { FrequencyToggle } from './FrequencyToggle';

const options = [
	{ value: 'instantly', label: translate( 'Instantly' ), checked: true },
	{ value: 'daily', label: translate( 'Daily' ), checked: false },
	{ value: 'weekly', label: translate( 'Weekly' ), checked: false },
];

interface EmailFrequencyGroupProps {
	isChecked: boolean;
	onChange: ( value: 'instantly' | 'daily' | 'weekly' ) => void;
	selectedOption: string;
	label: string;
	disabled: boolean;
}

/**
 * Runs a media query and returns its value when it changes.
 *
 * @param query - the media query to run.
 * @return return value of the media query.
 */
export default function useMediaQuery( query: string ) {
	const [ match, setMatch ] = useState( window.matchMedia( query ).matches );

	useEffect( () => {
		const updateMatch = () => setMatch( window.matchMedia( query ).matches );
		const list = window.matchMedia( query );
		list.addEventListener( 'change', updateMatch );
		return () => {
			list.addEventListener( 'change', updateMatch );
		};
	}, [ query ] );

	return match;
}

export const EmailFrequencyGroup = ( {
	selectedOption,
	isChecked,
	onChange,
	disabled,
}: EmailFrequencyGroupProps ) => {
	const isMobile = useMediaQuery( '(max-width: 400px)' );

	if ( isMobile ) {
		return (
			<>
				<select
					className="verbum-email-frequency-select"
					value={ selectedOption }
					onChange={ ( { currentTarget } ) =>
						onChange( currentTarget.value as 'instantly' | 'daily' | 'weekly' )
					}
					title={ translate( 'Email me new posts' ) }
					disabled={ ! isChecked || disabled }
				>
					{ options.map( el => (
						<option key={ el.value } value={ el.value }>
							{ el.label }
						</option>
					) ) }
				</select>
			</>
		);
	}

	return (
		<div className="verbum-email-frequency">
			<FrequencyToggle
				initialOptions={ options }
				onChange={ onChange }
				disabled={ ! isChecked || disabled }
				selectedOption={ selectedOption }
				name="frequency-toggle"
			/>
		</div>
	);
};
