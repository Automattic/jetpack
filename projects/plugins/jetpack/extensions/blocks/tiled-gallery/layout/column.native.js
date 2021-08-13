// import { View } from 'react-native';

export default function Column( { children, width } ) {
	const style = width ? { flexBasis: `${ width }%` } : undefined;
	return <>{ children }</>;
}
