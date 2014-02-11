			<div class="footer">
				<?php /* if ( ! $is_connected || ! $is_user_connected ) : ?>
				<div class="fly">
					<a href="<?php echo $this->build_connect_url() ?>" class="download-jetpack">Connect to WordPress.com</a>
				</div>
				<?php endif; */?>
			
				<nav class="primary nav-horizontal">
					<div class="a8c-attribution">
						<span>An <a href="http://automattic.com/" class="a8c-logo">Automattic</a> Airline</span>
					</div>
				</nav><!-- .primary -->
			
				<nav class="secondary nav-horizontal">
					<div class="secondary-footer">
						<a href="http://jetpack.me">Jetpack <?php echo JETPACK__VERSION; ?></a>
						<a href="http://wordpress.com/tos/">Terms</a>
						<a href="http://automattic.com/privacy/">Privacy</a>
						<a href="admin.php?page=jetpack-debugger" title="Contact the Jetpack Happiness Squad.">Debug</a>
						<a href="/support/" title="Contact the Jetpack Happiness Squad.">Support</a>
						<a href="http://jetpack.me/survey/?rel=<?php echo JETPACK__VERSION; ?>" title="Take a survey.  Tell us how we're doing.">Give Us Feedback</a>
					</div>
				</nav><!-- .secondary -->
			</div><!-- .footer -->	
		</div><!-- .wrapper -->
		<div class="modal"></div>
		<div class="shade"></div>
	</div><!-- .jp-frame -->
</div><!-- .jp-content -->

<?php if ( 'jetpack_modules' == $_GET['page'] ) return; ?>

<script id="modalLoading" type="text/html">
	<div class="loading"><span>loading…</span></div>
</script>
<script id="modalTemplate" type="text/html">
	<header>
		<a href="#" class="close">x</a>
		<ul>
			<li><a href="#" class="active">Learn More</a></li>
			<li><a href="#">Config</a></li>
		</ul>
	</header>
	<div class="content-container"><div class="content"></div></div>
	
</script>
<script id="mod" type="text/html">
	<div href="{{ url }}" data-name="{{ name }}" class="module{{#new}} new{{/new}}">
		<h3>{{ name }}{{^free}}<span class="paid">Paid</span>{{/free}}</h3>
		<p>{{{ short_description }}}</p>
	</div>
</script>
<script id="modconfig" type="text/html">
	<tr class="configs {{#active}}active{{/active}}">
		<td class="sm"><input type="checkbox"></td>
		<td><a href="{{ url }}" data-name="{{ name }}">{{ name }}</a></td>
		<td class="med"><a href="{{ url }}" data-name="{{ name }}"><span class="genericon genericon-help" title="Learn more"></span></a>{{#hasConfig}}<a href="{{ url }}" data-name="{{ name }}"><span class="genericon genericon-cog" title="Configure"></span></a>{{/hasConfig}}</td>
	</tr>
</script>
<script type="text/javascript">
	var _gaq = _gaq || [];
	_gaq.push(['_setAccount', 'UA-52447-43']);
	_gaq.push(['_trackPageview']);
	
	(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	})();
</script>