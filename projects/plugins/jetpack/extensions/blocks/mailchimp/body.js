import { InnerBlocks, RichText } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import {
	BLOCK_CLASS,
	NOTIFICATION_ERROR,
	NOTIFICATION_PROCESSING,
	NOTIFICATION_SUCCESS,
	DEFAULT_EMAIL_PLACEHOLDER,
	DEFAULT_CONSENT_TEXT,
	DEFAULT_PROCESSING_LABEL,
	DEFAULT_SUCCESS_LABEL,
	DEFAULT_ERROR_LABEL,
} from './constants';

const innerButtonBlock = {
	name: 'jetpack/button',
	attributes: {
		element: 'button',
		text: __( 'Join my Mailchimp audience', 'jetpack' ),
		uniqueId: 'mailchimp-widget-id',
	},
};

const Body = ( { attributes, setAttributes, audition } ) => {
	const {
		emailPlaceholder = DEFAULT_EMAIL_PLACEHOLDER,
		consentText = DEFAULT_CONSENT_TEXT,
		processingLabel = DEFAULT_PROCESSING_LABEL,
		successLabel = DEFAULT_SUCCESS_LABEL,
		errorLabel = DEFAULT_ERROR_LABEL,
	} = attributes;

	const notification = {
		[ NOTIFICATION_PROCESSING ]: processingLabel,
		[ NOTIFICATION_SUCCESS ]: successLabel,
		[ NOTIFICATION_ERROR ]: errorLabel,
	}[ audition ];

	return (
		<div
			className={ clsx( {
				[ `${ BLOCK_CLASS }_notication-audition` ]: audition,
			} ) }
		>
			<TextControl
				aria-label={ emailPlaceholder }
				className={ `${ BLOCK_CLASS }_text-input` }
				disabled
				onChange={ () => false }
				placeholder={ emailPlaceholder }
				title={ __( 'You can edit the email placeholder in the sidebar.', 'jetpack' ) }
				type="email"
			/>
			<InnerBlocks
				template={ [ [ innerButtonBlock.name, innerButtonBlock.attributes ] ] }
				templateLock="all"
			/>
			<RichText
				tagName="p"
				placeholder={ __( 'Write consent text', 'jetpack' ) }
				value={ consentText }
				onChange={ value => setAttributes( { consentText: value } ) }
				inlineToolbar
			/>
			{ audition && (
				<div
					className={ `${ BLOCK_CLASS }_notification ${ BLOCK_CLASS }_${ audition }` }
					role={ audition === NOTIFICATION_ERROR ? 'alert' : 'status' }
				>
					{ notification }
				</div>
			) }
		</div>
	);
};

export default Body;
