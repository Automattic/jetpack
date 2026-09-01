/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */
import { Button, Flex, Navigator } from '@wordpress/components';
import { useReducer } from 'react';
import { NavigatorModal } from '../index.tsx';
import type { Meta } from '@storybook/react';

const meta: Meta< typeof NavigatorModal > = {
	title: 'JS Packages/Components/NavigatorModal',
	component: NavigatorModal,
};

export default meta;

/**
 * Default NavigatorModal story with multiple screens.
 *
 * @return Default navigator modal story
 */
export const Default = () => {
	const [ isOpen, toggleOpen ] = useReducer( open => ! open, true );

	return (
		isOpen && (
			<NavigatorModal initialPath="/" onClose={ toggleOpen }>
				<NavigatorModal.Screen path="/" title="Screen 1" isScreenLocked={ true }>
					<div style={ { padding: '1.5rem' } }>
						<p>Welcome to the first screen!</p>
						<Navigator.Button path="/screen-2" variant="primary">
							Go to Screen 2
						</Navigator.Button>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen path="/screen-2" title="Screen 2" isScreenLocked={ false }>
					<div style={ { padding: '1.5rem' } }>
						<p>You&apos;re on the second screen.</p>
						<Navigator.Button path="/screen-3" variant="primary">
							Go to Screen 3
						</Navigator.Button>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen path="/screen-3" title="Screen 3" isScreenLocked={ false }>
					<div style={ { padding: '1.5rem' } }>
						<p>This is the final screen.</p>
						<p>Use the back button or close button to navigate.</p>
					</div>
				</NavigatorModal.Screen>
			</NavigatorModal>
		)
	);
};

/**
 * Basic NavigatorModal with a single screen.
 *
 * @return Single screen navigator modal story
 */
export const SingleScreen = () => {
	const [ isOpen, toggleOpen ] = useReducer( open => ! open, true );

	return (
		isOpen && (
			<NavigatorModal initialPath="/" onClose={ toggleOpen }>
				<NavigatorModal.Screen path="/" title="Single Screen" isScreenLocked={ true }>
					<div style={ { padding: '1.5rem' } }>
						<p>This is a simple single screen modal.</p>
					</div>
				</NavigatorModal.Screen>
			</NavigatorModal>
		)
	);
};

/**
 * NavigatorModal with multiple screens demonstrating navigation between them.
 *
 * @return Multi-screen navigator modal story
 */
export const MultipleScreens = () => {
	const [ isOpen, toggleOpen ] = useReducer( open => ! open, true );

	return (
		isOpen && (
			<NavigatorModal initialPath="/" onClose={ toggleOpen }>
				<NavigatorModal.Screen path="/" title="Home" isScreenLocked={ true }>
					<div style={ { padding: '1.5rem' } }>
						<h2>Home Screen</h2>
						<Navigator.Button path="/settings" variant="primary">
							Navigate to Settings
						</Navigator.Button>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen path="/settings" title="Settings" isScreenLocked={ false }>
					<div style={ { padding: '1.5rem' } }>
						<h2>Settings Screen</h2>
						<p>Configure your preferences here.</p>
					</div>
				</NavigatorModal.Screen>
			</NavigatorModal>
		)
	);
};

/**
 * NavigatorModal starting at a non-default initial path.
 *
 * @return Navigator modal with custom initial path story
 */
export const CustomInitialPath = () => {
	const [ isOpen, toggleOpen ] = useReducer( open => ! open, true );

	return (
		isOpen && (
			<NavigatorModal initialPath="/settings" onClose={ toggleOpen }>
				<NavigatorModal.Screen path="/" title="Home" isScreenLocked={ true }>
					<div style={ { padding: '1.5rem' } }>
						<p>Home screen content</p>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen path="/settings" title="Settings" isScreenLocked={ false }>
					<div style={ { padding: '1.5rem' } }>
						<p>Settings is the initial screen displayed.</p>
					</div>
				</NavigatorModal.Screen>
			</NavigatorModal>
		)
	);
};

/**
 * NavigatorModal with rich content and multiple navigation levels.
 *
 * @return Complex multi-screen navigator modal story
 */
export const ComplexNavigation = () => {
	const [ isOpen, toggleOpen ] = useReducer( open => ! open, true );

	const handleSaveChanges = () => console.log( 'Account changes saved' );
	const handleCancelChanges = () => console.log( 'Changes cancelled' );

	return (
		isOpen && (
			<NavigatorModal initialPath="/" onClose={ toggleOpen }>
				<NavigatorModal.Screen path="/" title="Dashboard" isScreenLocked={ true }>
					<div style={ { padding: '1.5rem' } }>
						<h2>Welcome to Dashboard</h2>
						<p>Choose an option below:</p>
						<div style={ { marginTop: '20px', display: 'flex', gap: '10px' } }>
							<Navigator.Button path="/profile" variant="primary">
								Profile Settings
							</Navigator.Button>
							<Navigator.Button path="/account" variant="secondary">
								Account Options
							</Navigator.Button>
							<Navigator.Button path="/help" variant="tertiary">
								Help &amp; Support
							</Navigator.Button>
						</div>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen path="/profile" title="Profile Settings" isScreenLocked={ false }>
					<div style={ { padding: '1.5rem' } }>
						<h2>Edit Your Profile</h2>
						<p>Update your profile information here.</p>
						<Button variant="primary">Save Changes</Button>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen
					path="/account"
					title="Account Options"
					isScreenLocked={ false }
					footerActions={ [
						{
							children: 'Cancel',
							variant: 'secondary',
							onClick: handleCancelChanges,
						},
						{
							children: 'Save Changes',
							variant: 'primary',
							onClick: handleSaveChanges,
						},
					] }
					sidebar={
						<Flex direction="column" gap={ 2 } style={ { padding: '1.5rem' } } justify="start">
							<Navigator.Button path="/account/privacy" variant="tertiary">
								Privacy Settings
							</Navigator.Button>
							<Navigator.Button path="/account/security" variant="tertiary">
								Security Settings
							</Navigator.Button>
						</Flex>
					}
				>
					<div style={ { padding: '1.5rem' } }>
						<h2>Account Management</h2>
						<p>Manage your account settings.</p>
						<Button variant="secondary">Change Password</Button>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen
					path="/account/privacy"
					title="Privacy Settings"
					isScreenLocked={ false }
				>
					<div style={ { padding: '1.5rem' } }>
						<h2>Privacy Settings</h2>
						<p>Control your privacy preferences.</p>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen
					path="/account/security"
					title="Security Settings"
					isScreenLocked={ false }
				>
					<div style={ { padding: '1.5rem' } }>
						<h2>Security Settings</h2>
						<p>Manage your security options.</p>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen path="/help" title="Help &amp; Support" isScreenLocked={ false }>
					<div style={ { padding: '1.5rem' } }>
						<h2>Help &amp; Support</h2>
						<p>Get help with common questions.</p>
						<p>Contact our support team for assistance.</p>
					</div>
				</NavigatorModal.Screen>
			</NavigatorModal>
		)
	);
};

/**
 * NavigatorModal with footer actions.
 *
 * @return Navigator modal with footer actions story
 */
export const WithFooterActions = () => {
	const [ isOpen, toggleOpen ] = useReducer( open => ! open, true );

	const handleConfirm = () => console.log( 'Changes confirmed' );
	const handleCancel = () => console.log( 'Changes cancelled' );

	return (
		isOpen && (
			<NavigatorModal initialPath="/" onClose={ toggleOpen }>
				<NavigatorModal.Screen path="/" title="Form Screen" isScreenLocked={ true }>
					<div style={ { padding: '1.5rem' } }>
						<h2>Fill Out This Form</h2>
						<p>The next screen has footer actions at the bottom.</p>
						<Navigator.Button path="/confirmation" variant="primary">
							Next
						</Navigator.Button>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen
					path="/confirmation"
					title="Confirm Changes"
					isScreenLocked={ false }
					footerActions={ [
						( { navigate } ) => (
							<Button
								key="cancel"
								variant="secondary"
								onClick={ () => {
									handleCancel();
									navigate();
								} }
							>
								Cancel
							</Button>
						),
						( { navigate } ) => (
							<Button
								key="confirm"
								variant="primary"
								onClick={ () => {
									handleConfirm();
									navigate();
								} }
							>
								Confirm
							</Button>
						),
					] }
				>
					<div style={ { padding: '1.5rem' } }>
						<h2>Are you sure?</h2>
						<p>Please confirm your changes before proceeding.</p>
					</div>
				</NavigatorModal.Screen>
			</NavigatorModal>
		)
	);
};

/**
 * NavigatorModal with sidebar navigation.
 *
 * @return Navigator modal with sidebar story
 */
export const WithSidebar = () => {
	const [ isOpen, toggleOpen ] = useReducer( open => ! open, true );

	const sidebar = (
		<Flex direction="column" gap={ 2 } style={ { padding: '1.5rem' } } justify="start">
			<Navigator.Button path="/general" variant="tertiary">
				General
			</Navigator.Button>
			<Navigator.Button path="/advanced" variant="tertiary">
				Advanced
			</Navigator.Button>
			<Navigator.Button path="/notifications" variant="tertiary">
				Notifications
			</Navigator.Button>
		</Flex>
	);

	return (
		isOpen && (
			<NavigatorModal initialPath="/" onClose={ toggleOpen }>
				<NavigatorModal.Screen
					path="/"
					title="Settings"
					isScreenLocked={ true }
					sidebar={ sidebar }
				>
					<div style={ { padding: '1.5rem' } }>
						<h2>Choose a Setting Category</h2>
						<p>Select from the sidebar to navigate to different settings.</p>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen
					path="/general"
					title="General Settings"
					isScreenLocked={ false }
					sidebar={ sidebar }
				>
					<div style={ { padding: '1.5rem' } }>
						<h2>General Settings</h2>
						<p>Configure general preferences for your account.</p>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen
					path="/advanced"
					title="Advanced Settings"
					isScreenLocked={ false }
					sidebar={ sidebar }
				>
					<div style={ { padding: '1.5rem' } }>
						<h2>Advanced Settings</h2>
						<p>Configure advanced options for power users.</p>
					</div>
				</NavigatorModal.Screen>

				<NavigatorModal.Screen
					path="/notifications"
					title="Notification Settings"
					isScreenLocked={ false }
					sidebar={ sidebar }
				>
					<div style={ { padding: '1.5rem' } }>
						<h2>Notification Settings</h2>
						<p>Control how and when you receive notifications.</p>
					</div>
				</NavigatorModal.Screen>
			</NavigatorModal>
		)
	);
};
