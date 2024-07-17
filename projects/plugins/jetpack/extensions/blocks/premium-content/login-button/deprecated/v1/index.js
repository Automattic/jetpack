import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import getColorAndStyleProps from '../../color-props';

export default {
	attributes: {
		text: {
			type: 'string',
			source: 'html',
			selector: 'a',
			default: __( 'Log in', 'jetpack' ),
		},
		borderRadius: {
			type: 'number',
		},
		backgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		gradient: {
			type: 'string',
		},
		style: {
			type: 'object',
		},
	},
	supports: {
		align: true,
		alignWide: false,
		html: false,
		lightBlockWrapper: true,
		inserter: false,
	},
	save: ( { attributes } ) => {
		const { borderRadius, text } = attributes;
		const colorProps = getColorAndStyleProps( attributes );
		const buttonClasses = clsx( 'wp-block-button__link', colorProps.className, {
			'no-border-radius': borderRadius === 0,
		} );
		const buttonStyle = {
			borderRadius: borderRadius ? borderRadius + 'px' : undefined,
			...colorProps.style,
		};
		return (
			<div className="wp-block-button">
				<RichText.Content
					tagName="a"
					className={ buttonClasses }
					style={ buttonStyle }
					value={ text }
				/>
			</div>
		);
	},
};
