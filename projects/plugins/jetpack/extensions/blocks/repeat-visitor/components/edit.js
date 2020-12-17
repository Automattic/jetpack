/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Notice, TextControl, RadioControl, Placeholder } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { InnerBlocks } from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
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

class RepeatVisitorEdit extends Component {
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
			return sprintf(
				_n(
					'This block will only appear to people who have visited this page more than once.',
					'This block will only appear to people who have visited this page more than %d times.',
					+this.props.attributes.threshold,
					'jetpack'
				),
				this.props.attributes.threshold
			);
		}

		return sprintf(
			_n(
				'This block will only appear to people who are visiting this page for the first time.',
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
				<InnerBlocks />
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
