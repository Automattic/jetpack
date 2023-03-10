import { InnerBlocks } from '@wordpress/block-editor';
import { Notice, TextControl, RadioControl, Placeholder } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import { CRITERIA_AFTER, CRITERIA_BEFORE } from '../constants';
import { icon } from '../index';

const RADIO_OPTIONS = [
	{
		value: CRITERIA_AFTER,
		label: __( 'Show after threshold', 'jetpack' ),
	},
	{
		value: CRITERIA_BEFORE,
		label: __( 'Show before threshold', 'jetpack' ),
	},
];

export class RepeatVisitorEdit extends Component {
	state = {
		isThresholdValid: true,
	};

	setCriteria = criteria => this.props.setAttributes( { criteria } );
	setThreshold = threshold => {
		if ( /^\d+$/.test( threshold ) && +threshold > 0 ) {
			this.props.setAttributes( { threshold: +threshold } );
			this.setState( { isThresholdValid: true } );
			return;
		}
		this.setState( { isThresholdValid: false } );
	};

	getNoticeLabel() {
		if ( this.props.attributes.criteria === CRITERIA_AFTER ) {
			if ( 1 === this.props.attributes.threshold ) {
				return __(
					'This block will only appear to people who have visited this page more than once.',
					'jetpack'
				);
			}

			return sprintf(
				/* translators: placeholder is a number. */
				_n(
					'This block will only appear to people who have visited this page more than %d time.',
					'This block will only appear to people who have visited this page more than %d times.',
					+this.props.attributes.threshold,
					'jetpack'
				),
				this.props.attributes.threshold
			);
		}

		if ( 1 === this.props.attributes.threshold ) {
			return __(
				'This block will only appear to people who are visiting this page for the first time.',
				'jetpack'
			);
		}

		return sprintf(
			/* translators: placeholder is a number. */
			_n(
				'This block will only appear to people who are visiting this page for %d time.',
				'This block will only appear to people who have visited this page at most %d times.',
				+this.props.attributes.threshold,
				'jetpack'
			),
			this.props.attributes.threshold
		);
	}

	render() {
		return (
			<div
				className={ classNames( this.props.className, {
					'wp-block-jetpack-repeat-visitor--is-unselected': ! this.props.isSelected,
				} ) }
			>
				<Placeholder
					icon={ icon }
					label={ __( 'Repeat Visitor', 'jetpack' ) }
					className="wp-block-jetpack-repeat-visitor-placeholder"
				>
					<TextControl
						className="wp-block-jetpack-repeat-visitor-threshold"
						defaultValue={ this.props.attributes.threshold }
						help={
							this.state.isThresholdValid ? '' : __( 'Please enter a valid number.', 'jetpack' )
						}
						label={ __( 'Visit count threshold', 'jetpack' ) }
						min="1"
						onChange={ this.setThreshold }
						pattern="[0-9]"
						type="number"
					/>

					<RadioControl
						label={ __( 'Visibility', 'jetpack' ) }
						selected={ this.props.attributes.criteria }
						options={ RADIO_OPTIONS }
						onChange={ this.setCriteria }
					/>
				</Placeholder>

				<Notice status="info" isDismissible={ false }>
					{ this.getNoticeLabel() }
				</Notice>
				<div className="wp-block-jetpack-repeat-visitor__inner-container">
					<InnerBlocks />
				</div>
			</div>
		);
	}
}

export default withSelect( ( select, ownProps ) => {
	const { isBlockSelected, hasSelectedInnerBlock } = select( 'core/block-editor' );
	return {
		isSelected: isBlockSelected( ownProps.clientId ) || hasSelectedInnerBlock( ownProps.clientId ),
	};
} )( RepeatVisitorEdit );
