/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import {
	Button,
	PanelBody,
	Path,
	Placeholder,
	DateTimePicker,
	RadioControl,
} from '@wordpress/components';
import { InnerBlocks, InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import renderMaterialIcon from '../../shared/render-material-icon';
import './editor.scss';

const RADIO_OPTIONS = [
	{
		value: 'displayBlock',
		label: __( 'Display block at this time', 'jetpack' ),
	},
	{
		value: 'hideBlock',
		label: __( 'Hide block at this time', 'jetpack' ),
	},
];

class ScheduleContentBlock extends Component {
	onClick = event => {
		this.props.setAttributes( { hasScheduledBlock: true } );
	};

	render() {
		const { attributes, setAttributes } = this.props;
		const { date, radioOption, hasScheduledBlock } = attributes;

		const radioOnChange = radioOption => {
			setAttributes( { radioOption } );
		};
		const onChangeDate = dateSelected => {
			setAttributes( { date: new Date( dateSelected ).getTime() } );
		};
		return (
			<Fragment>
				{ hasScheduledBlock && (
					<InspectorControls>
						<PanelBody>
							<p>{ __( 'Change the scheduled date of the content below.', 'jetpack' ) }</p>
							<RadioControl
								selected={ radioOption }
								options={ RADIO_OPTIONS }
								onChange={ radioOnChange }
							/>
							<DateTimePicker currentDate={ date } onChange={ onChangeDate } />
						</PanelBody>
					</InspectorControls>
				) }
				{ ! hasScheduledBlock && (
					<Placeholder
						label={ __( 'Schedule Content', 'jetpack' ) }
						className="jetpack-schedule-content-block__settings"
						icon={ renderMaterialIcon(
							<Path d="M12.5 8H11v6l4.75 2.85.75-1.23-4-2.37zm4.837-6.19l4.607 3.845-1.28 1.535-4.61-3.843zm-10.674 0l1.282 1.536L3.337 7.19l-1.28-1.536zM12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" />
						) }
						instructions={ __(
							"Select the date and time of which you'd like your block to appear.",
							'jetpack'
						) }
					>
						<RadioControl
							selected={ radioOption }
							options={ RADIO_OPTIONS }
							onChange={ radioOnChange }
						/>
						<DateTimePicker currentDate={ date } onChange={ onChangeDate } />
						<Button onClick={ this.onClick } isSecondary isLarge>
							{ __( 'Save settings', 'jetpack' ) }
						</Button>
					</Placeholder>
				) }
				{ hasScheduledBlock && (
					<div>
						<InnerBlocks templateLock={ false } />
					</div>
				) }
			</Fragment>
		);
	}
}

export default ScheduleContentBlock;
