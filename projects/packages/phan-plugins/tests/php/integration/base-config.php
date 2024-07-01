<?php

return array(
	'backward_compatibility_checks' => false,
	'enable_class_alias_support'    => false,
	'redundant_condition_detection' => true,
	'plugins'                       => array(
		__DIR__ . '/../../../src/HtmlTemplatePlugin.php',
	),
	'globals_type_map'              => array(),
	'directory_list'                => array(
		'.',
	),
	'exclude_file_regex'            => '@^(?:\\./)?(?:skip|config)(?:\.twice)?(?:\.polyfill)?\.php$@',
);
