import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { compact } from 'lodash';
import { getIconColor } from '../../shared/block-icons';
import renderMaterialIcon from '../../shared/render-material-icon';

const defaultBlockStyling = {
	style: {
		spacing: {
			padding: {
				top: '16px',
				right: '16px',
				bottom: '16px',
				left: '16px',
			},
		},
	},
};

const variations = compact( [
	{
		name: 'contact-form',
		title: __( 'Contact Form', 'jetpack' ),
		description: __( 'Add a contact form to your page', 'jetpack' ),
		icon: renderMaterialIcon(
			<>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M12 5.3203L6.6477 9L12 12.6797L17.3523 9L12 5.3203ZM12 3.5L4 9L12 14.5L20 9L12 3.5Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M4 18V9H5.5V18C5.5 18.4142 5.83579 18.75 6.25 18.75H17.75C18.1642 18.75 18.5 18.4142 18.5 18V9H20V18C20 19.2426 18.9926 20.25 17.75 20.25H6.25C5.00736 20.25 4 19.2426 4 18Z"
					fill={ getIconColor() }
				/>
			</>,
			24,
			24,
			'0 0 24 24'
		),
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack' ) } ],
			[ 'jetpack/field-textarea', { label: __( 'Message', 'jetpack' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Contact Us', 'jetpack' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			...defaultBlockStyling,
		},
	},
	! isSimpleSite() && {
		name: 'newsletter-form',
		title: __( 'Newsletter Sign-up', 'jetpack' ),
		description: __(
			'A simple way to collect information from folks visiting your site',
			'jetpack'
		),
		keywords: [ __( 'subscribe', 'jetpack' ), __( 'email', 'jetpack' ), __( 'signup', 'jetpack' ) ],
		icon: renderMaterialIcon(
			<>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M7 8C7 7.72386 7.22386 7.5 7.5 7.5H19.5C19.7761 7.5 20 7.72386 20 8V16C20 16.2761 19.7761 16.5 19.5 16.5H10.5V18H19.5C20.6046 18 21.5 17.1046 21.5 16V8C21.5 6.89543 20.6046 6 19.5 6H7.5C6.39543 6 5.5 6.89543 5.5 8V9.5H7V8Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M9 15.25H3V13.75H9V15.25Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M9 12.5H4V11H9V12.5Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M9 18H2V16.5H9V18Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M6.01196 7.56955L6.98815 6.43066L13.5001 12.0123L20.012 6.43066L20.9881 7.56955L13.5001 13.9879L6.01196 7.56955Z"
					fill={ getIconColor() }
				/>
			</>,
			24,
			24,
			'0 0 24 24'
		),
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack' ) } ],
			[ 'jetpack/field-consent', {} ],
			[
				'jetpack/button',
				{
					text: __( 'Subscribe', 'jetpack' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			...defaultBlockStyling,
		},
	},
	{
		name: 'rsvp-form',
		title: __( 'RSVP Form', 'jetpack' ),
		description: __( 'Add an RSVP form to your page', 'jetpack' ),
		icon: renderMaterialIcon(
			<>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M7.87868 15.5L5.5 17.8787L5.5 6C5.5 5.72386 5.72386 5.5 6 5.5L18 5.5C18.2761 5.5 18.5 5.72386 18.5 6L18.5 15C18.5 15.2761 18.2761 15.5 18 15.5L7.87868 15.5ZM8.5 17L18 17C19.1046 17 20 16.1046 20 15L20 6C20 4.89543 19.1046 4 18 4L6 4C4.89543 4 4 4.89543 4 6L4 18.9393C4 19.5251 4.47487 20 5.06066 20C5.34196 20 5.61175 19.8883 5.81066 19.6893L8.5 17Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M15.6087 7.93847L11.4826 13.6692L8.45898 10.5196L9.54107 9.48084L11.3175 11.3313L14.3914 7.06201L15.6087 7.93847Z"
					fill={ getIconColor() }
				/>
			</>,
			24,
			24,
			'0 0 24 24'
		),
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack' ) } ],
			[
				'jetpack/field-radio',
				{
					label: __( 'Attending?', 'jetpack' ),
					required: true,
					options: [ __( 'Yes', 'jetpack' ), __( 'No', 'jetpack' ) ],
				},
			],
			[ 'jetpack/field-textarea', { label: __( 'Other Details', 'jetpack' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Send RSVP', 'jetpack' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			...defaultBlockStyling,
			subject: __( 'A new RSVP from your website', 'jetpack' ),
		},
	},
	{
		name: 'registration-form',
		title: __( 'Registration Form', 'jetpack' ),
		description: __( 'Add a Registration form to your page', 'jetpack' ),
		icon: renderMaterialIcon(
			<>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M18.5 5.5V8H20V5.5H22.5V4H20V1.5H18.5V4H16V5.5H18.5ZM12 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V12H18.5V18C18.5 18.2761 18.2761 18.5 18 18.5H6C5.72386 18.5 5.5 18.2761 5.5 18V6C5.5 5.72386 5.72386 5.5 6 5.5H12V4Z"
					fill={ getIconColor() }
				/>
				<Path
					d="M16.75 17.5V15.5C16.75 13.9812 15.5188 12.75 14 12.75H10C8.48122 12.75 7.25 13.9812 7.25 15.5V17.5H8.75V15.5C8.75 14.8096 9.30964 14.25 10 14.25H14C14.6904 14.25 15.25 14.8096 15.25 15.5V17.5H16.75Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9ZM13 9C13 9.55228 12.5523 10 12 10C11.4477 10 11 9.55228 11 9C11 8.44772 11.4477 8 12 8C12.5523 8 13 8.44772 13 9Z"
					fill={ getIconColor() }
				/>
			</>,
			24,
			24,
			'0 0 24 24'
		),
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack' ) } ],
			[ 'jetpack/field-telephone', { label: __( 'Phone', 'jetpack' ) } ],
			[
				'jetpack/field-select',
				{
					label: __( 'How did you hear about us?', 'jetpack' ),
					options: [
						__( 'Search Engine', 'jetpack' ),
						__( 'Social Media', 'jetpack' ),
						__( 'TV', 'jetpack' ),
						__( 'Radio', 'jetpack' ),
						__( 'Friend or Family', 'jetpack' ),
					],
				},
			],
			[ 'jetpack/field-textarea', { label: __( 'Other Details', 'jetpack' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Send', 'jetpack' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			...defaultBlockStyling,
			subject: __( 'A new registration from your website', 'jetpack' ),
		},
	},
	{
		name: 'appointment-form',
		title: __( 'Appointment Form', 'jetpack' ),
		description: __( 'Add an Appointment booking form to your page', 'jetpack' ),
		icon: renderMaterialIcon(
			<>
				<Path
					d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8H4V6Z"
					fill={ getIconColor() }
				/>
				<Path d="M7 9.25H11V13.25H7V9.25Z" fill={ getIconColor() } />
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M6 5.5H18C18.2761 5.5 18.5 5.72386 18.5 6V12H20V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H12V18.5H6C5.72386 18.5 5.5 18.2761 5.5 18V6C5.5 5.72386 5.72386 5.5 6 5.5Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M17.25 21V15H18.75V21H17.25Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M15 17.25L21 17.25L21 18.75L15 18.75L15 17.25Z"
					fill={ getIconColor() }
				/>
			</>,
			24,
			24,
			'0 0 24 24'
		),
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack' ) } ],
			[ 'jetpack/field-telephone', { required: true, label: __( 'Phone', 'jetpack' ) } ],
			[ 'jetpack/field-date', { label: __( 'Date', 'jetpack' ), required: true } ],
			[
				'jetpack/field-radio',
				{
					label: __( 'Time', 'jetpack' ),
					required: true,
					options: [ __( 'Morning', 'jetpack' ), __( 'Afternoon', 'jetpack' ) ],
				},
			],
			[ 'jetpack/field-textarea', { label: __( 'Notes', 'jetpack' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Book Appointment', 'jetpack' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			...defaultBlockStyling,
			subject: __( 'A new appointment booked from your website', 'jetpack' ),
		},
	},
	{
		name: 'feedback-form',
		title: __( 'Feedback Form', 'jetpack' ),
		description: __( 'Add a Feedback form to your page', 'jetpack' ),
		icon: renderMaterialIcon(
			<>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M9.5 11C10.3284 11 11 10.3284 11 9.5C11 8.67157 10.3284 8 9.5 8C8.67157 8 8 8.67157 8 9.5C8 10.3284 8.67157 11 9.5 11Z"
					fill={ getIconColor() }
				/>
				<Path
					d="M16 9.5C16 10.3284 15.3284 11 14.5 11C13.6716 11 13 10.3284 13 9.5C13 8.67157 13.6716 8 14.5 8C15.3284 8 16 8.67157 16 9.5Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M14.5 11C15.3284 11 16 10.3284 16 9.5C16 8.67157 15.3284 8 14.5 8C13.6716 8 13 8.67157 13 9.5C13 10.3284 13.6716 11 14.5 11Z"
					fill={ getIconColor() }
				/>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M8.16492 14.6566L7.41431 13.7183L8.58561 12.7812L9.33622 13.7195C9.98358 14.5287 10.9637 14.9998 12 14.9998C13.0362 14.9998 14.0163 14.5287 14.6637 13.7195L15.4143 12.7812L16.5856 13.7183L15.835 14.6566C14.903 15.8216 13.4919 16.4998 12 16.4998C10.508 16.4998 9.09693 15.8216 8.16492 14.6566Z"
					fill={ getIconColor() }
				/>
			</>,
			24,
			24,
			'0 0 24 24'
		),
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack' ) } ],
			[
				'jetpack/field-radio',
				{
					label: __( 'Please rate our website', 'jetpack' ),
					required: true,
					options: [
						__( '1 - Very Bad', 'jetpack' ),
						__( '2 - Poor', 'jetpack' ),
						__( '3 - Average', 'jetpack' ),
						__( '4 - Good', 'jetpack' ),
						__( '5 - Excellent', 'jetpack' ),
					],
				},
			],
			[ 'jetpack/field-textarea', { label: __( 'How could we improve?', 'jetpack' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Send Feedback', 'jetpack' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			...defaultBlockStyling,
			subject: __( 'New feedback received from your website', 'jetpack' ),
		},
	},
] );

export default variations;
