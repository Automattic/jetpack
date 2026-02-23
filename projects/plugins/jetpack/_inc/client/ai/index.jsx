import { __, _x } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { Component } from 'react';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { connectModuleOptions } from 'components/module-settings/connect-module-options';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

class AiSettings extends Component {
	static displayName = 'AiSettings';

	static propTypes = {
		searchTerm: PropTypes.string,
		active: PropTypes.bool,
		updateOptions: PropTypes.func.isRequired,
		isUpdating: PropTypes.func,
		getSettingCurrentValue: PropTypes.func,
	};

	static defaultProps = {
		searchTerm: '',
		active: false,
		isUpdating: () => false,
		getSettingCurrentValue: () => ( {} ),
	};

	isAiFound = () => {
		if ( this.props.searchTerm ) {
			return (
				[
					_x( 'ai', 'Search term.', 'jetpack' ),
					_x( 'mcp', 'Search term.', 'jetpack' ),
					_x( 'model context protocol', 'Search term.', 'jetpack' ),
				]
					.join( ' ' )
					.toLowerCase()
					.indexOf( this.props.searchTerm.toLowerCase() ) > -1
			);
		}

		return true;
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
		const { searchTerm, active, isUpdating } = this.props;
		const mcpAbilities = this.props.getSettingCurrentValue( 'mcp_abilities' ) || {};

		if ( ! searchTerm && ! active ) {
			return null;
		}

		if ( ! this.isAiFound() ) {
			return null;
		}

		const abilityNames = Object.keys( mcpAbilities );
		const hasAbilities = abilityNames.length > 0;
		const isEnabled = this.getIsMcpEnabled();
		const isSaving = isUpdating( 'mcp_abilities' );

		return (
			<div>
				<h1 className="screen-reader-text">{ __( 'Jetpack AI Settings', 'jetpack' ) }</h1>
				<SettingsCard
					{ ...this.props }
					header={ _x( 'AI', 'Settings header', 'jetpack' ) }
					hideButton
				>
					<SettingsGroup hasChild>
						{ ! hasAbilities && (
							<p className="jp-form-setting-explanation">
								{ __(
									'MCP (Model Context Protocol) abilities are not available on this site.',
									'jetpack'
								) }
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
			</div>
		);
	}
}

export default connectModuleOptions( AiSettings );
