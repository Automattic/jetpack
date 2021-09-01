
export default function App( { children, posts } ) {
	console.log( 'posts: ', posts );
	return (
		<div className="post-list-app">{ children }</div>
	)
}
