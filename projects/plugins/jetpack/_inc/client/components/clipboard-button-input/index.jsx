import clsx from 'clsx';
import PropTypes from 'prop-types';
import ClipboardButton from 'components/form/clipboard-button';
import TextInput from 'components/text-input';

import './style.scss';

export default function ClipboardButtonInput( {
	className,
	copy,
	isError,
	isValid,
	selectOnFocus,
	rna = false,
	value = '',
	...forwardedProps
} ) {
	return (
		<span className={ clsx( 'dops-clipboard-button-input', className ) }>
			<TextInput { ...forwardedProps } value={ value } type="text" selectOnFocus readOnly />
			<ClipboardButton text={ value } disabled={ forwardedProps.disabled } compact rna={ rna }>
				{ copy }
			</ClipboardButton>
		</span>
	);
}

ClipboardButtonInput.propTypes = {
	value: PropTypes.string,
	disabled: PropTypes.bool,
	className: PropTypes.string,
	copy: PropTypes.string,
	rna: PropTypes.bool,
};
