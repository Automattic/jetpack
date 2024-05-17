import { PanelBody, RadioControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function BlogStatsInspectorControls( { attributes, setAttributes } ) {
	const { statsData, statsOption } = attributes;

	const STATS_DATA_RADIO = [
		{
			value: 'views',
			label: __( 'Views', 'jetpack' ),
		},
		{
			value: 'visitors',
			label: __( 'Visitors', 'jetpack' ),
		},
	];

	const STATS_OPTION_RADIO = [
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
					label={ __( 'Views or visitors', 'jetpack' ) }
					selected={ statsData }
					onChange={ value => setAttributes( { statsData: value } ) }
					options={ STATS_DATA_RADIO }
					help={ __(
						'Views represent site visits, whereas visitors represent unique individuals.',
						'jetpack'
					) }
				/>
				<RadioControl
					label={ __( 'Show stats data for', 'jetpack' ) }
					selected={ statsOption }
					onChange={ value => setAttributes( { statsOption: value } ) }
					options={ STATS_OPTION_RADIO }
					disabled={ statsData === 'visitors' }
					help={
						statsData === 'visitors'
							? __( "Visitor counts aren't available for individual posts.", 'jetpack' )
							: null
					}
				/>
				<span className="jetpack-blog-stats__delay-notice">
					{ __( 'Stats are delayed for up to 5 minutes.', 'jetpack' ) }
				</span>
			</PanelBody>
		</>
	);
}
