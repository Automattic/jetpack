import apiFetch from '@wordpress/api-fetch';
import { Button, Flex, FlexItem, Modal, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './email-preview.scss';
import check from './check.svg';
import illoShare from './illo-share.svg';

export default function EmailPreview() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ emailSent, setEmailSent ] = useState( false );
	const [ emailSending, setEmailSending ] = useState( false );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	const sendEmailPreview = () => {
		setEmailSending( true );
		apiFetch( {
			path: '/wpcom/v2/send-email-preview/',
			method: 'POST',
			data: {
				id: postId,
			},
		} )
			.then( () => {
				// Handle response here
				setEmailSending( false );
				setEmailSent( true );
			} )
			.catch( () => {
				setEmailSending( false );

				// Handle error here
			} );
	};

	return (
		<>
			<FlexItem>
				<Button isPrimary onClick={ () => setIsModalOpen( true ) }>
					{ __( 'Send test email', 'jetpack' ) }
				</Button>
			</FlexItem>
			{ isModalOpen && (
				<Modal
					className="jetpack-email-preview"
					title={ __( 'Send a test email', 'jetpack' ) }
					onRequestClose={ () => setIsModalOpen( false ) }
				>
					{ emailSent ? (
						<Flex>
							<FlexItem className="jetpack-email-preview__email-sent">
								<img className="jetpack-email-preview__check" src={ check } alt="" />
								{ __( 'Email sent successfully', 'jetpack' ) }
							</FlexItem>
						</Flex>
					) : (
						<Flex>
							<FlexItem>
								<TextControl
									className="jetpack-email-preview__email"
									value={ window?.Jetpack_Editor_Initial_State?.tracksUserData?.email }
									disabled
								/>
							</FlexItem>
							<FlexItem>
								<Button
									className="jetpack-email-preview__button"
									isPrimary
									onClick={ sendEmailPreview }
									isBusy={ emailSending }
								>
									{ __( 'Send', 'jetpack' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<img className="jetpack-email-preview__img" src={ illoShare } alt="" />
							</FlexItem>
						</Flex>
					) }
				</Modal>
			) }
		</>
	);
}
