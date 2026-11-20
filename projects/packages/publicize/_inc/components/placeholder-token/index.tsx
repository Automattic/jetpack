import styles from './styles.module.scss';

type PlaceholderTokenProps = {
	/** The placeholder token, e.g. `{title}`. */
	children: string;
};

/**
 * Inline chip for a message-template placeholder token.
 *
 * @param {PlaceholderTokenProps} props - The component's props.
 * @return Element.
 */
export default function PlaceholderToken( { children }: PlaceholderTokenProps ) {
	return <code className={ styles[ 'placeholder-token' ] }>{ children }</code>;
}
