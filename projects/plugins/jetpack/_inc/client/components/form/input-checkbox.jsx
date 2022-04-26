/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { withFormsy } from 'formsy-react';

/**
 * Internal Dependencies
 */
import Label from './label';
import getUniqueId from './counter';
import FormInputValidation from '../form-input-validation';
import requiredFieldErrorFormatter from './required-error-label';

export default withFormsy(
	class extends React.Component {
		static displayName = 'CheckboxInput';

		static propTypes = {
			name: PropTypes.string.isRequired,
			description: PropTypes.string,
			className: PropTypes.any,
			style: PropTypes.any,
			label: PropTypes.any.isRequired,
			labelSuffix: PropTypes.any,
			required: PropTypes.any,
			validations: PropTypes.string,
			validationError: PropTypes.string,
		};

		state = {
			uniqueId: getUniqueId(),
		};

		static defaultProps = { required: false };

		changeValue = event => {
			this.setValue( event.target.checked );
		};

		render() {
			const { style, labelSuffix, label, ...other } = this.props;
			const uniqueId = this.state.uniqueId;
			let errorMessage;

			if ( ! this.isPristine() ) {
				errorMessage = this.showError() ? this.getErrorMessage() : null;
				if ( ! errorMessage ) {
					errorMessage = this.showRequired()
						? requiredFieldErrorFormatter( this.props.label || this.props.placeholder || '' )
						: null;
				}
			}

			const className = classNames(
				{
					'dops-field': true,
					'dops-form-checkbox': true,
					'dops-form-error': errorMessage,
				},
				this.props.className
			);

			return (
				<div className={ className } style={ style }>
					<Label
						inline
						label={ label }
						labelSuffix={ labelSuffix }
						htmlFor={ uniqueId }
						required={ this.props.required }
						description={ this.props.description }
					>
						<input
							type="checkbox"
							id={ uniqueId }
							{ ...other }
							onChange={ this.changeValue }
							checked={ this.getValue() }
							className="dops-form-checkbox"
						/>
					</Label>
					{ errorMessage && <FormInputValidation text={ errorMessage } isError={ true } /> }
				</div>
			);
		}
	}
);
