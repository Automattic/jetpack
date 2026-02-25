import { __, _x } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { Component } from 'react';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { connectModuleOptions } from 'components/module-settings/connect-module-options';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

class McpCard extends Component {
	static displayName = 'McpCard';

	static propTypes = {
		updateOptions: PropTypes.func.isRequired,
		isUpdating: PropTypes.func,
		getSettingCurrentValue: PropTypes.func,
	};

	static defaultProps = {
		isUpdating: () => false,
		getSettingCurrentValue: () => ( {} ),
	};

	getIsMcpEnabled = () => {
		const abilities = this.props.getSettingCurrentValue( 'mcp_abilities' ) || {};
		const keys = Object.keys( abilities );

		if ( keys.length === 0 ) {
			return false;
		}

		return keys.every( name => abilities[ name ] === 1 );
	};

	handleMcpToggle = () => {
		const abilities = this.props.getSettingCurrentValue( 'mcp_abilities' ) || {};
		const keys = Object.keys( abilities );

		if ( keys.length === 0 ) {
			return;
		}

		const newValue = this.getIsMcpEnabled() ? 0 : 1;
		const nextAbilities = {};
		keys.forEach( name => {
			nextAbilities[ name ] = newValue;
		} );

		this.props.updateOptions( { mcp_abilities: nextAbilities } );
	};

	render() {
		const { isUpdating } = this.props;
		const mcpAbilities = this.props.getSettingCurrentValue( 'mcp_abilities' ) || {};
		const abilityNames = Object.keys( mcpAbilities );
		const hasAbilities = abilityNames.length > 0;
		const isEnabled = this.getIsMcpEnabled();
		const isSaving = isUpdating( 'mcp_abilities' );

		return (
			<SettingsCard
				{ ...this.props }
				header={ _x( 'MCP access', 'Settings header', 'jetpack' ) }
				hideButton
			>
				<SettingsGroup hasChild>
					{ ! hasAbilities && (
						<p className="jp-form-setting-explanation">
							{ __( 'Enable MCP access for external AI assistants.', 'jetpack' ) }
						</p>
					) }
					{ hasAbilities && (
						<p>
							<CompactFormToggle
								compact
								checked={ isEnabled }
								disabled={ ! hasAbilities || isSaving }
								onChange={ this.handleMcpToggle }
								id="mcp-access-toggle"
							>
								{ __(
									'Allow AI assistants to access your site via MCP (Model Context Protocol).',
									'jetpack'
								) }
							</CompactFormToggle>
						</p>
					) }
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default connectModuleOptions( McpCard );
