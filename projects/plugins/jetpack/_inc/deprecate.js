addEventListener( 'DOMContentLoaded', () => {
	const notices = document.getElementsByClassName( 'jetpack-deprecate-dismissible' );
	for ( let i = 0; i < notices.length; ++i ) {
		if ( ! notices[ i ].hasAttribute( 'id' ) ) {
			continue;
		}

		notices[ i ].addEventListener( 'click', event => {
			if ( event.target.classList.contains( 'notice-dismiss' ) ) {
				document.cookie =
					'jetpack_deprecate_dismissed[' +
					notices[ i ].getAttribute( 'id' ) +
					']=1; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=None; Secure';
			}
		} );
	}

	var styleSheet = document.createElement( 'style' );

	// Define the CSS rules for placing the admin notice.
	styleSheet.innerHTML = `
		/* Clear the default Dashicon content */
		.jetpack-deprecate-dismissible .notice-dismiss::before {
			content: '';
		}

		/* Customize the .notice-dismiss button */
		.jetpack-deprecate-dismissible .notice-dismiss {
			position: absolute;
			width: 24px;
			height: 24px;
			top: 24px;
			right:12px;
		}

		.jetpack-deprecate-dismissible .notice-dismiss::after {
			background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="%23555" d="M12 10.586L6.343 4.93 4.93 6.343 10.586 12l-5.657 5.657 1.414 1.414L12 13.414l5.657 5.657 1.414-1.414L13.414 12l5.657-5.657-1.414-1.414L12 10.586z"/></svg>'); /* Inline SVG as background image */
			background-repeat: no-repeat;
			background-size: contain;
			content: '';
			display: block;
			position: absolute;
			top: 6px;
			left: 6px;
			width: 20px;
			height: 20px;
			transform: translate(-50%, -50%);
		}

		/* Customize the styling of content within the notice container */
		.jetpack-deprecation-notice-container {
			align-items: flex-start;
			display: flex;
			padding-bottom: 24px;
			padding-left: 12px;
			padding-top: 14px;
		}

		.jetpack-deprecation-notice-svg {
			margin-right: 10px;
			padding-top:10px;
		}

		.jetpack-deprecation-notice-icon {
			margin-right: 10px;
		}

		.jetpack-deprecation-notice-text {
			display: block;
		}

		.jetpack-deprecation-notice-title {
			font-weight: 600;
		}

		.jetpack-deprecation-notice-link {
			font-weight: 600;
			color: #000000;
		}

    `;

	// Append the style element to the document's head
	document.head.appendChild( styleSheet );
} );
