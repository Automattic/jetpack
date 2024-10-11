import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { Children, FunctionComponent, LabelHTMLAttributes } from 'react';

import './style.scss';

export interface Props {
	optional?: boolean;
	required?: boolean;
}

type LabelProps = LabelHTMLAttributes< HTMLLabelElement >;

const FormLabel: FunctionComponent< Props & LabelProps > = ( {
	children,
	required,
	optional,
	className, // Via LabelProps
	...labelProps
} ) => {
	const hasChildren: boolean = Children.count( children ) > 0;

	return (
		// eslint-disable-next-line jsx-a11y/label-has-associated-control
		<label { ...labelProps } className={ clsx( className, 'form-label' ) }>
			{ children }
			{ hasChildren && required && (
				<small className="form-label__required">{ __( 'Required', 'jetpack-mu-wpcom' ) }</small>
			) }
			{ hasChildren && optional && (
				<small className="form-label__optional">{ __( 'Optional', 'jetpack-mu-wpcom' ) }</small>
			) }
		</label>
	);
};

export default FormLabel;
