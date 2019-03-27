/**
 * External dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { TextControl } from '@wordpress/components';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { __ } from '../../utils/i18n';

export default class TestimonialEdit extends Component {
	onChangeAuthor = value => void this.props.setAttributes( { author: value } );

	render() {
		const { attributes, className, isSelected } = this.props;

		return (
			<Fragment>
				<div
					className={ classnames( className, {
						'is-selected': isSelected,
					} ) }
				>
					<TextControl
						label={ __( 'Author Name' ) }
						value={ attributes.author }
						onChange={ this.onChangeAuthor }
						type="text"
					/>
				</div>
			</Fragment>
		);
	}
}
