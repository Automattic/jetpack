import { PlainText } from '@wordpress/block-editor';
import clsx from 'clsx';

const simpleInput = ( type, props, label, view, onChange, rootProps = {} ) => {
	const { isSelected } = props;
	const value = props.attributes[ type ];

	rootProps.className = clsx( rootProps.className, `jetpack-${ type }-block`, {
		'is-selected': isSelected,
	} );

	return (
		<div { ...rootProps }>
			{ ! isSelected && value !== '' && view( props ) }
			{ ( isSelected || value === '' ) && (
				<PlainText
					value={ value }
					placeholder={ label }
					aria-label={ label }
					onChange={ onChange }
				/>
			) }
		</div>
	);
};

export default simpleInput;
