/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

export default class Label extends React.Component {
	static displayName = 'Label';

	static propTypes = {
		style: PropTypes.any,
		label: PropTypes.any,
		labelSuffix: PropTypes.any,
		labelClassName: PropTypes.string,
		description: PropTypes.string,
		htmlFor: PropTypes.string,
		required: PropTypes.any,
		inline: PropTypes.any,
	};

	render() {
		const label = this.props.label,
			className = classNames(
				{
					'dops-form-label': true,
					'dops-form-inline': this.props.inline,
				},
				this.props.className
			);

		return (
			<div className={ className } style={ this.props.style }>
				{ label && (
					<label className={ this.props.labelClassName } htmlFor={ this.props.htmlFor }>
						{ this.props.inline && this.props.children }
						<span>
							{ label }
							{ this.props.required ? <span aria-hidden={ true }>*</span> : null }
							{ this.props.labelSuffix }
						</span>
					</label>
				) }

				{ ( ! this.props.inline || ! label ) && this.props.children }

				{ this.props.description && (
					<p className="dops-field-description">{ this.props.description }</p>
				) }
			</div>
		);
	}
}
