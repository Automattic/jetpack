import { useCallback } from 'react';
import styles from './styles.module.scss';

const FormToggle = ( {
	ariaLabel,
	checked = false,
	className = '',
	disabled = false,
	id,
	onChange = () => {},
	onKeyDown = () => {},
	switchClassNames = '',
	toggling,
} ) => {
	const onClick = useCallback( () => {
		if ( ! disabled ) {
			onChange();
		}
	}, [ disabled, onChange ] );

	const handleKeyDown = useCallback(
		event => {
			if ( disabled ) {
				return;
			}

			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				onChange();
			}

			onKeyDown( event );
		},
		[ disabled, onChange, onKeyDown ]
	);

	return (
		<>
			<div>
				<input
					className={ `${ styles[ 'form-toggle' ] } ${ className } ${
						toggling ? styles[ 'is-toggling' ] : ''
					}` }
					type="checkbox"
					checked={ checked }
					readOnly={ true }
					disabled={ disabled }
				/>
				<span
					className={ `${ styles[ 'form-toggle__switch' ] } ${ switchClassNames }` }
					disabled={ disabled }
					id={ id }
					onClick={ onClick }
					onKeyDown={ handleKeyDown }
					role="checkbox"
					aria-checked={ checked }
					aria-label={ ariaLabel }
					tabIndex={ disabled ? -1 : 0 }
				/>
			</div>
		</>
	);
};

export default FormToggle;
