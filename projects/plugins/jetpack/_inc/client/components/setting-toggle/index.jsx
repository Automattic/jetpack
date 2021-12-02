/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Internal dependencies
 */
import CompactFormToggle from 'components/form/form-toggle/compact';

export class SettingToggle extends React.Component {
	static propTypes = {
		toggleSetting: PropTypes.func,
		activated: PropTypes.bool,
		disabled: PropTypes.bool,
		className: PropTypes.string,
		id: PropTypes.string,
	};

	static defaultProps = {
		activated: false,
	};

	toggleSetting = () => {
		return this.props.toggleSetting( this.props.slug, this.props.activated );
	};

	render() {
		return (
			<CompactFormToggle
				checked={ this.props.activated }
				className={ this.props.className }
				onChange={ this.toggleSetting }
				disabled={ this.props.disabled }
				id={ this.props.id }
			>
				{ ' ' }
				{ this.props.children }
			</CompactFormToggle>
		);
	}
}
