import { PanelBody, RadioControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function BlogStatsInspectorControls( { attributes, setAttributes } ) {
	const { statsOption } = attributes;

	const RADIO_OPTIONS = [
		{
			value: 'site',
			label: __( 'My whole site', 'jetpack' ),
		},
		{
			value: 'post',
			label: __( 'This individual post', 'jetpack' ),
		},
	];

	return (
		<>
			<PanelBody title={ __( 'Settings', 'jetpack' ) }>
				<RadioControl
					label={ __( 'Show stats data for', 'jetpack' ) }
					selected={ statsOption }
					onChange={ value => setAttributes( { statsOption: value } ) }
					options={ RADIO_OPTIONS }
				/>
				<span className="jetpack-blog-stats__delay-notice">
					{ __( 'Stats are delayed for up to 5 minutes.', 'jetpack' ) }
				</span>
			</PanelBody>
		</>
	);
}
