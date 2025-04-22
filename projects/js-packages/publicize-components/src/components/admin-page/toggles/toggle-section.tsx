import { Container, Text } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import React from 'react';
import styles from './styles.module.scss';

type ToggleSectionProps = {
	/**
	 * Title of the Toggle.
	 */
	title: string;

	/**
	 * Whether the toggle is in beta.
	 */
	beta?: boolean;

	/**
	 * Callback to be called when the toggle is clicked.
	 */
	onChange: () => void;

	/**
	 * Whether the toggle is checked.
	 */
	checked: boolean;

	/**
	 * Whether the toggle is disabled.
	 */
	disabled: boolean;

	/**
	 * Children to be rendered inside the toggle.
	 */
	children: React.ReactNode;

	/**
	 * Whether to hide the toggle.
	 */
	hideToggle?: boolean;
};

/**
 * ToggleSection Component
 *
 * This component is used on the Social Admin page. It wraps a Jetpack styled toggle,
 * a title, and an optional description or additional content.
 *
 * @param {ToggleSectionProps} props - The properties that define the behavior and appearance of the component.
 * @return {JSX.Element} The rendered ToggleSection component.
 */
const ToggleSection: React.FC< ToggleSectionProps > = ( {
	title,
	beta,
	onChange,
	checked,
	disabled,
	children,
	hideToggle,
} ) => (
	<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
		<div className={ `${ styles.column } ${ hideToggle ? styles.notoggle : '' }` }>
			{ ! hideToggle && (
				<ToggleControl
					label={ '' }
					className={ styles.toggle }
					disabled={ disabled }
					checked={ checked }
					onChange={ onChange }
					__nextHasNoMarginBottom={ true }
				/>
			) }
			<Text className={ styles.title } variant="title-medium">
				{ title }
				{ beta && <div className={ styles.beta }>Beta</div> }
			</Text>

			{ children }
		</div>
	</Container>
);

export default ToggleSection;
