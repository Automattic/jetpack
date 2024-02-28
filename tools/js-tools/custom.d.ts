declare module '*.mdx';
declare module '*.module.scss' {
	const classes: { [ key: string ]: string };
	export default classes;
}
