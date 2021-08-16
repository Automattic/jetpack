<script>
	import { __ } from '@wordpress/i18n';

	const protocol = window.location.protocol.split( ':' )[ 0 ];
	const hostname = window.location.hostname;
</script>

<div class="url-container">
	<div class="segment">
		<div class="label">{__( 'Protocol', 'jetpack-boost' )}</div>

		<div class="arrows" />

		{protocol}
	</div>
	<div class="segment">://</div>
	<div class="segment">
		<div class="label">{__( 'Host name', 'jetpack-boost' )}</div>

		<div class="arrows" />

		{hostname}
	</div>
</div>
