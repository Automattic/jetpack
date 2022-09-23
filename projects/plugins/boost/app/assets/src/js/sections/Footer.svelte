<script>
	import { __ } from '@wordpress/i18n';
	import AutomatticLogo from '../svg/automattic.svg';
	import JetpackIcon from '../svg/jetpack.svg';
</script>

<footer class="jb-settings-footer">
	<div class="jb-signature--jetpack">
		<JetpackIcon />
		{__( 'Jetpack Boost', 'jetpack-boost' )}
	</div>
	<div class="jb-signature--automattic">
		<AutomatticLogo />
	</div>
</footer>
