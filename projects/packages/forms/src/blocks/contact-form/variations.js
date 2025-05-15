import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Path } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import { compact } from 'lodash';
import { getIconColor } from './util/block-icons';
import renderMaterialIcon from './util/render-material-icon';

const variations = compact( [
	{
		name: 'contact-form',
		title: __( 'Contact Form', 'jetpack-forms' ),
		description: __( 'Add a contact form to your page.', 'jetpack-forms' ),
		icon: {
			foreground: getIconColor(),
			src: renderMaterialIcon(
				<>
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 5.3203L6.6477 9L12 12.6797L17.3523 9L12 5.3203ZM12 3.5L4 9L12 14.5L20 9L12 3.5Z"
					/>
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M4 18V9H5.5V18C5.5 18.4142 5.83579 18.75 6.25 18.75H17.75C18.1642 18.75 18.5 18.4142 18.5 18V9H20V18C20 19.2426 18.9926 20.25 17.75 20.25H6.25C5.00736 20.25 4 19.2426 4 18Z"
					/>
				</>
			),
		},
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack-forms' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack-forms' ) } ],
			[ 'jetpack/field-textarea', { label: __( 'Message', 'jetpack-forms' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Contact Us', 'jetpack-forms' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],

		attributes: {
			variationName: 'default',
		},
	},
	{
		name: 'rsvp-form',
		title: __( 'RSVP Form', 'jetpack-forms' ),
		description: __( 'Add an RSVP form to your page', 'jetpack-forms' ),
		icon: {
			foreground: getIconColor(),
			src: renderMaterialIcon(
				<>
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M7.87868 15.5L5.5 17.8787L5.5 6C5.5 5.72386 5.72386 5.5 6 5.5L18 5.5C18.2761 5.5 18.5 5.72386 18.5 6L18.5 15C18.5 15.2761 18.2761 15.5 18 15.5L7.87868 15.5ZM8.5 17L18 17C19.1046 17 20 16.1046 20 15L20 6C20 4.89543 19.1046 4 18 4L6 4C4.89543 4 4 4.89543 4 6L4 18.9393C4 19.5251 4.47487 20 5.06066 20C5.34196 20 5.61175 19.8883 5.81066 19.6893L8.5 17Z"
					/>
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M15.6087 7.93847L11.4826 13.6692L8.45898 10.5196L9.54107 9.48084L11.3175 11.3313L14.3914 7.06201L15.6087 7.93847Z"
					/>
				</>
			),
		},
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack-forms' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack-forms' ) } ],
			[
				'jetpack/field-radio',
				{
					label: __( 'Attending?', 'jetpack-forms' ),
					required: true,
					options: [ __( 'Yes', 'jetpack-forms' ), __( 'No', 'jetpack-forms' ) ],
				},
			],
			[ 'jetpack/field-textarea', { label: __( 'Other Details', 'jetpack-forms' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Send RSVP', 'jetpack-forms' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			subject: __( 'A new RSVP from your website', 'jetpack-forms' ),
		},
		example: {
			innerBlocks: [
				{
					name: 'jetpack/field-name',
					attributes: { required: true, label: __( 'Name', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-email',
					attributes: { required: true, label: __( 'Email', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-radio',
					attributes: {
						label: __( 'Attending?', 'jetpack-forms' ),
						required: true,
						options: [ __( 'Yes', 'jetpack-forms' ), __( 'No', 'jetpack-forms' ) ],
					},
				},
				{
					name: 'jetpack/field-textarea',
					attributes: { label: __( 'Other Details', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/button',
					attributes: {
						text: __( 'Send RSVP', 'jetpack-forms' ),
						element: 'button',
						lock: { remove: true },
					},
				},
			],
		},
	},
	{
		name: 'registration-form',
		title: __( 'Registration Form', 'jetpack-forms' ),
		description: __( 'Add a Registration form to your page', 'jetpack-forms' ),
		icon: {
			foreground: getIconColor(),
			src: renderMaterialIcon(
				<>
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M18.5 5.5V8H20V5.5H22.5V4H20V1.5H18.5V4H16V5.5H18.5ZM12 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V12H18.5V18C18.5 18.2761 18.2761 18.5 18 18.5H6C5.72386 18.5 5.5 18.2761 5.5 18V6C5.5 5.72386 5.72386 5.5 6 5.5H12V4Z"
					/>
					<Path d="M16.75 17.5V15.5C16.75 13.9812 15.5188 12.75 14 12.75H10C8.48122 12.75 7.25 13.9812 7.25 15.5V17.5H8.75V15.5C8.75 14.8096 9.30964 14.25 10 14.25H14C14.6904 14.25 15.25 14.8096 15.25 15.5V17.5H16.75Z" />
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9ZM13 9C13 9.55228 12.5523 10 12 10C11.4477 10 11 9.55228 11 9C11 8.44772 11.4477 8 12 8C12.5523 8 13 8.44772 13 9Z"
					/>
				</>
			),
		},
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack-forms' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack-forms' ) } ],
			[ 'jetpack/field-telephone', { label: __( 'Phone', 'jetpack-forms' ) } ],
			[
				'jetpack/field-select',
				{
					label: __( 'How did you hear about us?', 'jetpack-forms' ),
					options: [
						__( 'Search Engine', 'jetpack-forms' ),
						__( 'Social Media', 'jetpack-forms' ),
						__( 'TV', 'jetpack-forms' ),
						__( 'Radio', 'jetpack-forms' ),
						__( 'Friend or Family', 'jetpack-forms' ),
					],
				},
			],
			[ 'jetpack/field-textarea', { label: __( 'Other Details', 'jetpack-forms' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Send', 'jetpack-forms' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			subject: __( 'A new registration from your website', 'jetpack-forms' ),
		},
		example: {
			innerBlocks: [
				{
					name: 'jetpack/field-name',
					attributes: { required: true, label: __( 'Name', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-email',
					attributes: { required: true, label: __( 'Email', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-telephone',
					attributes: { required: true, label: __( 'Phone', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-select',
					attributes: {
						label: __( 'How did you hear about us?', 'jetpack-forms' ),
						options: [
							__( 'Search Engine', 'jetpack-forms' ),
							__( 'Social Media', 'jetpack-forms' ),
							__( 'TV', 'jetpack-forms' ),
							__( 'Radio', 'jetpack-forms' ),
							__( 'Friend or Family', 'jetpack-forms' ),
						],
					},
				},
				{
					name: 'jetpack/field-textarea',
					attributes: { label: __( 'Other Details', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/button',
					attributes: {
						text: __( 'Send', 'jetpack-forms' ),
						element: 'button',
						lock: { remove: true },
					},
				},
			],
		},
	},
	{
		name: 'appointment-form',
		title: __( 'Appointment Form', 'jetpack-forms' ),
		description: __( 'Add an Appointment booking form to your page', 'jetpack-forms' ),
		icon: {
			foreground: getIconColor(),
			src: renderMaterialIcon(
				<>
					<Path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8H4V6Z" />
					<Path d="M7 9.25H11V13.25H7V9.25Z" />
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M6 5.5H18C18.2761 5.5 18.5 5.72386 18.5 6V12H20V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H12V18.5H6C5.72386 18.5 5.5 18.2761 5.5 18V6C5.5 5.72386 5.72386 5.5 6 5.5Z"
					/>
					<Path fillRule="evenodd" clipRule="evenodd" d="M17.25 21V15H18.75V21H17.25Z" />
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M15 17.25L21 17.25L21 18.75L15 18.75L15 17.25Z"
					/>
				</>
			),
		},
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack-forms' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack-forms' ) } ],
			[ 'jetpack/field-telephone', { required: true, label: __( 'Phone', 'jetpack-forms' ) } ],
			[ 'jetpack/field-date', { label: __( 'Date', 'jetpack-forms' ), required: true } ],
			[
				'jetpack/field-radio',
				{
					label: __( 'Time', 'jetpack-forms' ),
					required: true,
					options: [ __( 'Morning', 'jetpack-forms' ), __( 'Afternoon', 'jetpack-forms' ) ],
				},
			],
			[ 'jetpack/field-textarea', { label: __( 'Notes', 'jetpack-forms' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Book Appointment', 'jetpack-forms' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			subject: __( 'A new appointment booked from your website', 'jetpack-forms' ),
		},
		example: {
			innerBlocks: [
				{
					name: 'jetpack/field-name',
					attributes: { required: true, label: __( 'Name', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-email',
					attributes: { required: true, label: __( 'Email', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-telephone',
					attributes: { required: true, label: __( 'Phone', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-date',
					attributes: { required: true, label: __( 'Date', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-radio',
					attributes: {
						label: __( 'Time', 'jetpack-forms' ),
						required: true,
						options: [ __( 'Morning', 'jetpack-forms' ), __( 'Afternoon', 'jetpack-forms' ) ],
					},
				},
				{
					name: 'jetpack/field-textarea',
					attributes: { label: __( 'Notes', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/button',
					attributes: {
						text: __( 'Book Appointment', 'jetpack-forms' ),
						element: 'button',
						lock: { remove: true },
					},
				},
			],
		},
	},
	{
		name: 'feedback-form',
		title: __( 'Feedback Form', 'jetpack-forms' ),
		description: __( 'Add a Feedback form to your page', 'jetpack-forms' ),
		icon: {
			foreground: getIconColor(),
			src: renderMaterialIcon(
				<>
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z"
					/>
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M9.5 11C10.3284 11 11 10.3284 11 9.5C11 8.67157 10.3284 8 9.5 8C8.67157 8 8 8.67157 8 9.5C8 10.3284 8.67157 11 9.5 11Z"
					/>
					<Path d="M16 9.5C16 10.3284 15.3284 11 14.5 11C13.6716 11 13 10.3284 13 9.5C13 8.67157 13.6716 8 14.5 8C15.3284 8 16 8.67157 16 9.5Z" />
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M14.5 11C15.3284 11 16 10.3284 16 9.5C16 8.67157 15.3284 8 14.5 8C13.6716 8 13 8.67157 13 9.5C13 10.3284 13.6716 11 14.5 11Z"
					/>
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8.16492 14.6566L7.41431 13.7183L8.58561 12.7812L9.33622 13.7195C9.98358 14.5287 10.9637 14.9998 12 14.9998C13.0362 14.9998 14.0163 14.5287 14.6637 13.7195L15.4143 12.7812L16.5856 13.7183L15.835 14.6566C14.903 15.8216 13.4919 16.4998 12 16.4998C10.508 16.4998 9.09693 15.8216 8.16492 14.6566Z"
					/>
				</>
			),
		},
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack-forms' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack-forms' ) } ],
			[
				'jetpack/field-radio',
				{
					label: __( 'Please rate our website', 'jetpack-forms' ),
					required: true,
					options: [
						__( '1 - Very Bad', 'jetpack-forms' ),
						__( '2 - Poor', 'jetpack-forms' ),
						__( '3 - Average', 'jetpack-forms' ),
						__( '4 - Good', 'jetpack-forms' ),
						__( '5 - Excellent', 'jetpack-forms' ),
					],
				},
			],
			[ 'jetpack/field-textarea', { label: __( 'How could we improve?', 'jetpack-forms' ) } ],
			[
				'jetpack/button',
				{
					text: __( 'Send Feedback', 'jetpack-forms' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {
			subject: __( 'New feedback received from your website', 'jetpack-forms' ),
		},
		example: {
			innerBlocks: [
				{
					name: 'jetpack/field-name',
					attributes: { required: true, label: __( 'Name', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-email',
					attributes: { required: true, label: __( 'Email', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-radio',
					attributes: {
						label: __( 'Please rate our website', 'jetpack-forms' ),
						required: true,
						options: [
							__( '1 - Very Bad', 'jetpack-forms' ),
							__( '2 - Poor', 'jetpack-forms' ),
							__( '3 - Average', 'jetpack-forms' ),
							__( '4 - Good', 'jetpack-forms' ),
							__( '5 - Excellent', 'jetpack-forms' ),
						],
					},
				},
				{
					name: 'jetpack/field-textarea',
					attributes: { label: __( 'How could we improve?', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/button',
					attributes: {
						text: __( 'Send Feedback', 'jetpack-forms' ),
						element: 'button',
						lock: { remove: true },
					},
				},
			],
		},
	},
	! ( isAtomicSite() || isSimpleSite() ) && {
		name: 'lead-capture-form',
		title: __( 'Lead capture', 'jetpack-forms' ),
		description: __( 'A simple way to collect leads using forms on your site.', 'jetpack-forms' ),
		keywords: [
			_x( 'subscribe', 'block search term', 'jetpack-forms' ),
			_x( 'email', 'block search term', 'jetpack-forms' ),
			_x( 'signup', 'block search term', 'jetpack-forms' ),
		],
		icon: {
			foreground: getIconColor(),
			src: people,
		},
		innerBlocks: [
			[ 'jetpack/field-name', { required: true, label: __( 'Name', 'jetpack-forms' ) } ],
			[ 'jetpack/field-email', { required: true, label: __( 'Email', 'jetpack-forms' ) } ],
			[ 'jetpack/field-consent', {} ],
			[
				'jetpack/button',
				{
					text: __( 'Subscribe', 'jetpack-forms' ),
					element: 'button',
					lock: { remove: true },
				},
			],
		],
		attributes: {},
		example: {
			innerBlocks: [
				{
					name: 'jetpack/field-name',
					attributes: { required: true, label: __( 'Name', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-email',
					attributes: { required: true, label: __( 'Email', 'jetpack-forms' ) },
				},
				{
					name: 'jetpack/field-consent',
					attributes: {},
				},
				{
					name: 'jetpack/button',
					attributes: {
						text: __( 'Subscribe', 'jetpack-forms' ),
						element: 'button',
						lock: { remove: true },
					},
				},
			],
		},
	},
	{
		name: 'multistep-form',
		title: __( 'Multistep Form', 'jetpack-forms' ),
		description: __( 'Create a form that spans multiple steps.', 'jetpack-forms' ),
		icon: {
			foreground: getIconColor(),
			src: renderMaterialIcon(
				<Path
					d="M21.5 8V19C21.5 20.518 20.521 21.5 19.001 21.5H6V20H19.001C19.69 20 20 19.69 20 19V8H21.5ZM16.2227 2C17.2042 2.00023 17.9998 2.79585 18 3.77734V16.2227C17.9998 17.2042 17.2042 17.9998 16.2227 18H3.77734C2.79585 17.9998 2.00023 17.2042 2 16.2227V3.77734C2.00023 2.79585 2.79585 2.00023 3.77734 2H16.2227ZM3.77734 3.33301C3.53223 3.33324 3.33324 3.53223 3.33301 3.77734V16.2227C3.33324 16.4678 3.53223 16.6668 3.77734 16.667H16.2227C16.4678 16.6668 16.6668 16.4678 16.667 16.2227V3.77734C16.6668 3.53223 16.4678 3.33324 16.2227 3.33301H3.77734ZM7.16699 10.8887C7.99515 10.8889 8.66687 11.5605 8.66699 12.3887V13.833L8.65918 13.9863C8.58244 14.7426 7.94349 15.3328 7.16699 15.333H5.72266L5.56934 15.3252C4.86332 15.2535 4.3021 14.6924 4.23047 13.9863L4.22266 13.833V12.3887C4.22277 11.6121 4.813 10.9733 5.56934 10.8965L5.72266 10.8887H7.16699ZM5.72266 11.8887C5.44659 11.8887 5.22277 12.1126 5.22266 12.3887V13.833C5.22266 14.1091 5.44651 14.333 5.72266 14.333H7.16699C7.44293 14.3328 7.66699 14.109 7.66699 13.833V12.3887C7.66687 12.1128 7.44286 11.8889 7.16699 11.8887H5.72266ZM15.7773 14H10.4443V12.667H15.7773V14ZM7.16699 4.66699C7.99522 4.66723 8.66699 5.33871 8.66699 6.16699V7.61133L8.65918 7.76465C8.58231 8.52082 7.9434 9.11111 7.16699 9.11133H5.72266L5.56934 9.10352C4.86344 9.03184 4.30226 8.47051 4.23047 7.76465L4.22266 7.61133V6.16699C4.22266 5.39033 4.81293 4.7516 5.56934 4.6748L5.72266 4.66699H7.16699ZM5.72266 5.66699C5.44651 5.66699 5.22266 5.89085 5.22266 6.16699V7.61133C5.22283 7.88732 5.44662 8.11133 5.72266 8.11133H7.16699C7.44283 8.11109 7.66682 7.88718 7.66699 7.61133V6.16699C7.66699 5.891 7.44294 5.66723 7.16699 5.66699H5.72266ZM15.7773 7.33301H10.4443V6H15.7773V7.33301Z"
					fill="currentColor"
				/>
			),
		},
		innerBlocks: [
			[
				'jetpack/form-progress-indicator',
				{
					labels: [
						__( 'Contact Info', 'jetpack-forms' ),
						__( 'Details', 'jetpack-forms' ),
						__( 'Preferences', 'jetpack-forms' ),
					],
					activeStep: 0,
					showLabels: true,
				},
			],
			[
				'jetpack/step-container',
				{},
				[
					[
						'jetpack/form-step',
						{ title: __( 'Contact Information', 'jetpack-forms' ) },
						[
							[
								'jetpack/field-name',
								{ required: true, label: __( 'Full Name', 'jetpack-forms' ) },
							],
							[
								'jetpack/field-email',
								{ required: true, label: __( 'Email Address', 'jetpack-forms' ) },
							],
							[ 'jetpack/field-telephone', { label: __( 'Phone Number', 'jetpack-forms' ) } ],
							[ 'jetpack/form-step-navigation' ],
						],
					],
					[
						'jetpack/form-step',
						{ title: __( 'Additional Details', 'jetpack-forms' ) },
						[
							[
								'jetpack/field-select',
								{
									label: __( 'How did you hear about us?', 'jetpack-forms' ),
									options: [
										__( 'Search Engine', 'jetpack-forms' ),
										__( 'Social Media', 'jetpack-forms' ),
										__( 'Recommendation', 'jetpack-forms' ),
										__( 'Advertisement', 'jetpack-forms' ),
										__( 'Other', 'jetpack-forms' ),
									],
								},
							],
							[
								'jetpack/field-textarea',
								{ label: __( 'What can we help you with?', 'jetpack-forms' ), required: true },
							],
							[ 'jetpack/form-step-navigation' ],
						],
					],
					[
						'jetpack/form-step',
						{ title: __( 'Preferences', 'jetpack-forms' ) },
						[
							[
								'jetpack/field-select',
								{
									label: __( 'Preferred contact method', 'jetpack-forms' ),
									options: [ __( 'Email', 'jetpack-forms' ), __( 'Phone', 'jetpack-forms' ) ],
								},
							],
							[
								'jetpack/field-textarea',
								{
									label: __( 'Additional notes or preferences', 'jetpack-forms' ),
								},
							],
							[ 'jetpack/form-step-navigation' ],
						],
					],
				],
			],
		],
		attributes: {
			variationName: 'multistep',
		},
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: attributes => attributes.variationName === 'multistep',
	},
] );

export default variations;
