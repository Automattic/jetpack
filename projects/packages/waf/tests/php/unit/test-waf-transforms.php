<?php
/**
 * Adapted from modsecurity tests: https://github.com/SpiderLabs/ModSecurity/tree/caadf97524a4861456be176a8cb91dcbb76b97e4/tests/tfn
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Transforms as GlobalWafTransforms;

/**
 * Transforms test suite.
 */
final class WafTransformsTest extends PHPUnit\Framework\TestCase {

	/**
	 * Instance of Waf_Transforms
	 *
	 * @var GlobalWafTransforms
	 */
	private $t;

	/**
	 * Test setup
	 *
	 * @before
	 */
	protected function before() {
		$this->t = new GlobalWafTransforms();
	}

	/**
	 * Main test function
	 *
	 * @param string $tfn The name of the transform function that is being tested.
	 * @param array  $tests The tests cases, each key in the array is the raw value with the value being the expected transformed value.
	 *
	 * @dataProvider transformDataProvider
	 */
	public function testTransforms( $tfn, $tests ) {
		$i = 1;
		foreach ( $tests as $in => $out ) {
			$this->assertSame( $out, $this->t->$tfn( $in ), "Failed #$i with input: $in" );
			++$i;
		}
	}

	/**
	 * Test data provider
	 */
	public function transformDataProvider() {
		yield array(
			'base64_decode',
			array(
				''                 => '',
				'VGVzdENhc2U='     => 'TestCase',
				'VGVzdENhc2Ux'     => 'TestCase1',
				'VGVzdENhc2UxMg==' => 'TestCase12',
			),
		);

		yield array(
			'base64_encode',
			array(
				''           => '',
				'TestCase'   => 'VGVzdENhc2U=',
				'TestCase1'  => 'VGVzdENhc2Ux',
				'TestCase12' => 'VGVzdENhc2UxMg==',
				"Test\0Case" => 'VGVzdABDYXNl',
			),
		);

		yield array(
			'compress_whitespace',
			array(
				''                    => '',
				'TestCase'            => 'TestCase',
				"Test\0Case"          => "Test\0Case",
				'Test Case'           => 'Test Case',
				"  Test  \t   Case  " => ' Test Case ',
				"This is a   test case with a tab \t, vtab \x0b, newline \x0a, return \x0d, formfeed \f, and a NUL\0 in it with a CRLF at the end.\x0d\x0a" => "This is a test case with a tab , vtab , newline , return , formfeed , and a NUL\0 in it with a CRLF at the end. ",
			),
		);

		yield array(
			'hex_decode',
			array(
				''                   => '',
				'5465737443617365'   => 'TestCase',
				'546573740043617365' => "Test\0Case",
							// todo: these are invalid hex strings that PHP handles differently than modsecurity's code
							// '01234567890a0z01234567890a' => "\x01#Eg\x89\x0a#\x01#Eg\x89\x0a",
							// '01234567890az' => "\x01#Eg\x89\x0a",
							// '01234567890a0' => "\x01#Eg\x89\x0a", .
			),
		);

		yield array(
			'hex_encode',
			array(
				'TestCase'   => '5465737443617365',
				"Test\0Case" => '546573740043617365',
			),
		);

		yield array(
			'html_entity_decode',
			array(
				''           => '',
				'TestCase'   => 'TestCase',
				"Test\0Case" => "Test\0Case",
							// todo: PHP's html_entity_decode works differently than modsecurity, fails these tests
							// "&#x0;&#X0;&#x20;&#X20;&#0;&#32;\0&#100;&quot;&amp;&lt;&gt;&nbsp;" => "\0\0\x20\x20\0\x20\0\x64\"&<>\xa0",
							// "&#x0&#X0&#x20&#X20&#0&#32\0&#100&quot&amp&lt&gt&nbsp" => "\0\0\x20\x20\0\x20\0\x64\"&<>\xa0",
							// "&#xg;&#Xg;&#xg0;&#X2g;&#a;\0&#a2;&#3a&#a00;&#1a0;&#10a;&foo;" => "&#xg;&#Xg;&#xg0;\x02g;&#a;\0&#a2;\x03a&#a00;\x01a0;\x0aa;&foo;",
							// "&#xg&#Xg&#xg0&#X2g&#a\0&#a2&#3a&#a00&#1a0&#10a&foo" => "&#xg&#Xg&#xg0\x02g&#a\0&#a2\x03a&#a00\x01a0\x0aa&foo", .
			),
		);

		yield array(
			'length',
			array(
				'0123456789abcdef'   => 16,
				"0123456789\tabcdef" => 17,
				"Test\0Case"         => 9,
			),
		);

		yield array(
			'lowercase',
			array(
				''           => '',
				'testcase'   => 'testcase',
				"test\0case" => "test\0case",
				'TestCase'   => 'testcase',
				"Test\0Case" => "test\0case",
			),
		);

		yield array(
			'md5',
			array(
				''                                     => "\xd4\x1d\x8c\xd9\x8f\x00\xb2\x04\xe9\x80\x09\x98\xec\xf8\x42\x7e",
				'TestCase'                             => "\xc9\xab\xa2\xc3\xe6\x01\x26\x16\x9e\x80\xe9\xa2\x6b\xa2\x73\xc1",
				"\x00\x01\x02\x03\x04\x05\x06\x07\x08" => "\xa6\xe7\xd3\xb4\x6f\xdf\xaf\x0b\xde\x2a\x1f\x83\x2a\x00\xd2\xde",
			),
		);

		yield array(
			'normalize_path',
			array(
				''                                  => '',
				'/foo/bar/baz'                      => '/foo/bar/baz',
				"/foo/bar\0/baz"                    => "/foo/bar\0/baz",
				'x'                                 => 'x',
				'.'                                 => '',
				'./'                                => '',
				'./..'                              => '..',
				'./../'                             => '../',
				'..'                                => '..',
				'../'                               => '../',
				'../.'                              => '..',
				'.././'                             => '../',
				'../..'                             => '../..',
				'../../'                            => '../../',
				'/dir/foo//bar'                     => '/dir/foo/bar',
				'dir/foo//bar/'                     => 'dir/foo/bar/',
				'dir/../foo'                        => 'foo',
				'dir/../../foo'                     => '../foo',
				'dir/./.././../../foo/bar'          => '../../foo/bar',
				'dir/./.././../../foo/bar/.'        => '../../foo/bar',
				'dir/./.././../../foo/bar/./'       => '../../foo/bar/',
				'dir/./.././../../foo/bar/..'       => '../../foo',
				'dir/./.././../../foo/bar/../'      => '../../foo/',
				'dir/./.././../../foo/bar/'         => '../../foo/bar/',
				'dir//.//..//.//..//..//foo//bar'   => '../../foo/bar',
				'dir//.//..//.//..//..//foo//bar//' => '../../foo/bar/',
				'dir/subdir/subsubdir/subsubsubdir/../../..' => 'dir',
				'dir/./subdir/./subsubdir/./subsubsubdir/../../..' => 'dir',
				'dir/./subdir/../subsubdir/../subsubsubdir/..' => 'dir',
				'/dir/./subdir/../subsubdir/../subsubsubdir/../' => '/dir/',
							// todo: I have no idea how the input is supposed to turn into the output for this test:
							// "/./.././../../../../../../../\0/../etc/./passwd" => '/etc/passwd', .
			),
		);

		yield array(
			'normalize_path_win',
			array(
				''                                     => '',
				'\\foo\\bar\\baz'                      => '/foo/bar/baz',
				"\\foo\\bar\0\\baz"                    => "/foo/bar\0/baz",
				'x'                                    => 'x',
				'.'                                    => '',
				'.\\'                                  => '',
				'.\\..'                                => '..',
				'.\\..\\'                              => '../',
				'..'                                   => '..',
				'..\\'                                 => '../',
				'..\\.'                                => '..',
				'..\\.\\'                              => '../',
				'..\\..'                               => '../..',
				'..\\..\\'                             => '../../',
				'\\dir\\foo\\\\bar'                    => '/dir/foo/bar',
				'dir\\foo\\\\bar\\'                    => 'dir/foo/bar/',
				'dir\\..\\foo'                         => 'foo',
				'dir\\..\\..\\foo'                     => '../foo',
				'dir\\.\\..\\.\\..\\..\\foo\\bar'      => '../../foo/bar',
				'dir\\.\\..\\.\\..\\..\\foo\\bar\\.'   => '../../foo/bar',
				'dir\\.\\..\\.\\..\\..\\foo\\bar\\.\\' => '../../foo/bar/',
				'dir\\.\\..\\.\\..\\..\\foo\\bar\\..'  => '../../foo',
				'dir\\.\\..\\.\\..\\..\\foo\\bar\\../' => '../../foo/',
				'dir\\.\\..\\.\\..\\..\\foo\\bar\\'    => '../../foo/bar/',
				'dir\\\\.\\\\..\\\\.\\\\..\\\\..\\\\foo\\\\bar' => '../../foo/bar',
				'dir\\\\.\\\\..\\\\.\\\\..\\\\..\\\\foo\\\\bar\\\\' => '../../foo/bar/',
				'dir\\subdir\\subsubdir\\subsubsubdir\\..\\..\\..' => 'dir',
				'dir\\.\\subdir\\.\\subsubdir\\.\\subsubsubdir\\..\\..\\..' => 'dir',
				'dir\\.\\subdir\\..\\subsubdir\\..\\subsubsubdir\\..' => 'dir',
				'\\dir\\.\\subdir\\..\\subsubdir\\..\\subsubsubdir\\..\\' => '/dir/',
							// todo: I have no idea how the input is supposed to turn into the output for this test:
							// "\\.\\..\\.\\..\\..\\..\\..\\..\\..\\..\\\0\\..\\etc\\./passwd" => '/etc/passwd', .
			),
		);

		yield array(
			'remove_nulls',
			array(
				''               => '',
				'TestCase'       => 'TestCase',
				"Test\x01Case"   => "Test\x01Case",
				"\0TestCase"     => 'TestCase',
				"Test\0Case"     => 'TestCase',
				"Test\0\0Case"   => 'TestCase',
				"TestCase\0"     => 'TestCase',
				"\0Test\0Case\0" => 'TestCase',
			),
		);

		yield array(
			'remove_whitespace',
			array(
				''                    => '',
				'TestCase'            => 'TestCase',
				"Test\0Case"          => "Test\0Case",
				"  Test  \t   Case  " => 'TestCase',
				"This is a   test case with a tab \t, vtab \x0b, newline \x0a, return \x0d, formfeed \f, and a NUL\0 in it with a CRLF at the end.\x0d\x0a" => "Thisisatestcasewithatab,vtab,newline,return,formfeed,andaNUL\0initwithaCRLFattheend.",
			),
		);

		yield array(
			'replace_comments',
			array(
				''                            => '',
				'TestCase'                    => 'TestCase',
				"Test\0Case"                  => "Test\0Case",
				'/* TestCase */'              => ' ',
				'/*TestCase*/'                => ' ',
				'/* TestCase*/'               => ' ',
				'/*TestCase */'               => ' ',
				'Before/* TestCase */After'   => 'Before After',
				'Before /* TestCase */ After' => 'Before   After',
				"/* Test\x0d\x0aCase */"      => ' ',
				"/* Test\x0aCase */"          => ' ',
				"/* Test\x0dCase */"          => ' ',
				"Before/* Test\x0d\x0aCase "  => 'Before ',
				"Before /* Test\x0aCase "     => 'Before  ',
				"Test\x0d\x0aCase */After"    => "Test\x0d\x0aCase */After",
				"Test\x0aCase */ After"       => "Test\x0aCase */ After",
			),
		);

		yield array(
			'replace_nulls',
			array(
				''               => '',
				'TestCase'       => 'TestCase',
				"\0TestCase"     => ' TestCase',
				"Test\0Case"     => 'Test Case',
				"Test\0\0Case"   => 'Test  Case',
				"TestCase\0"     => 'TestCase ',
				"\0Test\0Case\0" => ' Test Case ',
			),
		);

		yield array(
			'sha1',
			array(
				''                                     => "\xda\x39\xa3\xee\x5e\x6b\x4b\x0d\x32\x55\xbf\xef\x95\x60\x18\x90\xaf\xd8\x07\x09",
				'TestCase'                             => "\xa7\x0c\xe3\x83\x89\xe3\x18\xbd\x2b\xe1\x8a\x01\x11\xc6\xdc\x76\xbd\x2c\xd9\xed",
				"\x00\x01\x02\x03\x04\x05\x06\x07\x08" => "\x63\xbf\x60\xc7\x10\x5a\x07\xa2\xb1\x25\xbb\xf8\x9e\x61\xab\xda\xbc\x69\x78\xc2",
			),
		);

		yield array(
			'trim',
			array(
				''                                     => '',
				'TestCase'                             => 'TestCase',
				"Test\0Case"                           => "Test\0Case",
				'    TestCase'                         => 'TestCase',
				'TestCase    '                         => 'TestCase',
				'    TestCase    '                     => 'TestCase',
				'    Test   Case    '                  => 'Test   Case',
				"    Test \0 Case    "                 => "Test \0 Case",
				" 	   Test \0 Case 	  	   \r\n  " => "Test \0 Case",
				"\n\r\t\v\f Test Case \n\r\t\v\f"      => 'Test Case',
			),
		);

		yield array(
			'trim_left',
			array(
				''                                     => '',
				'TestCase'                             => 'TestCase',
				"Test\0Case"                           => "Test\0Case",
				'TestCase   '                          => 'TestCase   ',
				'    TestCase'                         => 'TestCase',
				'    TestCase    '                     => 'TestCase    ',
				'    Test   Case    '                  => 'Test   Case    ',
				"    Test \0 Case    "                 => "Test \0 Case    ",
				" 	   Test \0 Case 	  	   \r\n  " => "Test \0 Case 	  	   \r\n  ",
				"\n\r\t\v\f Test Case \n\r\t\v\f"      => "Test Case \n\r\t\v\f",
			),
		);

		yield array(
			'trim_right',
			array(
				''                                     => '',
				'TestCase'                             => 'TestCase',
				'   TestCase'                          => '   TestCase',
				'TestCase   '                          => 'TestCase',
				'   TestCase   '                       => '   TestCase',
				'    Test   Case    '                  => '    Test   Case',
				"    Test \0 Case    "                 => "    Test \0 Case",
				" 	   Test \0 Case 	  	   \r\n  " => " 	   Test \0 Case",
				"\n\r\t\v\f Test Case \n\r\t\v\f"      => "\n\r\t\v\f Test Case",
			),
		);

		yield array(
			'url_decode',
			array(
				''                                   => '',
				'TestCase'                           => 'TestCase',
				"Test\0Case"                         => "Test\0Case",
				'+%00%01%02%03%04%05%06%07%08%09%0a%0b%0c%0d%0e%0f%10%11%12%13%14%15%16%17%18%19%1a%1b%1c%1d%1e%1f%20%21%22%23%24%25%26%27%28%29%2a%2b%2c%2d%2e%2f%30%31%32%33%34%35%36%37%38%39%3a%3b%3c%3d%3e%3f%40%41%42%43%44%45%46%47%48%49%4a%4b%4c%4d%4e%4f%50%51%52%53%54%55%56%57%58%59%5a%5b%5c%5d%5e%5f%60%61%62%63%64%65%66%67%68%69%6a%6b%6c%6d%6e%6f%70%71%72%73%74%75%76%77%78%79%7a%7b%7c%7d%7e%7f%80%81%82%83%84%85%86%87%88%89%8a%8b%8c%8d%8e%8f%90%91%92%93%94%95%96%97%98%99%9a%9b%9c%9d%9e%9f%a0%a1%a2%a3%a4%a5%a6%a7%a8%a9%aa%ab%ac%ad%ae%af%b0%b1%b2%b3%b4%b5%b6%b7%b8%b9%ba%bb%bc%bd%be%bf%c0%c1%c2%c3%c4%c5%c6%c7%c8%c9%ca%cb%cc%cd%ce%cf%d0%d1%d2%d3%d4%d5%d6%d7%d8%d9%da%db%dc%dd%de%df%e0%e1%e2%e3%e4%e5%e6%e7%e8%e9%ea%eb%ec%ed%ee%ef%f0%f1%f2%f3%f4%f5%f6%f7%f8%f9%fa%fb%fc%fd%fe%ff' => " \x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f \x21\x22\x23\x24\x25\x26\x27\x28\x29\x2a\x2b\x2c\x2d\x2e\x2f\x30\x31\x32\x33\x34\x35\x36\x37\x38\x39\x3a\x3b\x3c\x3d\x3e\x3f\x40\x41\x42\x43\x44\x45\x46\x47\x48\x49\x4a\x4b\x4c\x4d\x4e\x4f\x50\x51\x52\x53\x54\x55\x56\x57\x58\x59\x5a\x5b\x5c\x5d\x5e\x5f\x60\x61\x62\x63\x64\x65\x66\x67\x68\x69\x6a\x6b\x6c\x6d\x6e\x6f\x70\x71\x72\x73\x74\x75\x76\x77\x78\x79\x7a\x7b\x7c\x7d\x7e\x7f\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff",
				'Test+Case'                          => 'Test Case',
				'%+'                                 => '% ',
				'%%20'                               => '% ',
				'%0g%20'                             => '%0g ',
				'%0%20'                              => '%0 ',
				'%g0%20'                             => '%g0 ',
				'%g%20'                              => '%g ',
				'%0%1%2%3%4%5%6%7%8%9%0%a%b%c%d%e%f' => '%0%1%2%3%4%5%6%7%8%9%0%a%b%c%d%e%f',
				'%g0%g1%g2%g3%g4%g5%g6%g7%g8%g9%g0%ga%gb%gc%gd%ge%gf' => '%g0%g1%g2%g3%g4%g5%g6%g7%g8%g9%g0%ga%gb%gc%gd%ge%gf',
				'%0g%1g%2g%3g%4g%5g%6g%7g%8g%9g%0g%ag%bg%cg%dg%eg%fg' => '%0g%1g%2g%3g%4g%5g%6g%7g%8g%9g%0g%ag%bg%cg%dg%eg%fg',
				'%'                                  => '%',
				'%%'                                 => '%%',
				'%0g'                                => '%0g',
				'%gg'                                => '%gg',
			),
		);

		yield array(
			'utf8_to_unicode',
			array(
				'Ā ā Ă ă Ą ą Ć ć Ĉ ĉ Ċ ċ Č č Ď ď Đ đ Ē ē Ĕ ĕ Ė ė Ę ę Ě ě Ĝ ĝ Ğ ğ Ġ ġ Ģ ģ Ĥ ĥ Ħ ħ Ĩ ĩ Ī ī Ĭ ĭ Į į İ ı Ĳ ĳ Ĵ ĵ Ķ ķ ĸ Ĺ ĺ Ļ ļ Ľ ľ Ŀ ŀ Ł ł Ń ń Ņ ņ Ň ň ŉ Ŋ ŋ Ō ō Ŏ ŏ Ő ő Œ œ Ŕ ŕ Ŗ ŗ Ř ř Ś ś Ŝ ŝ Ş ş Š š Ţ ţ Ť ť Ŧ ŧ Ũ ũ Ū ū Ŭ ŭ Ů ů Ű ű Ų ų Ŵ ŵ Ŷ ŷ Ÿ Ź ź Ż ż Ž ž ſ' => '%u0100 %u0101 %u0102 %u0103 %u0104 %u0105 %u0106 %u0107 %u0108 %u0109 %u010a %u010b %u010c %u010d %u010e %u010f %u0110 %u0111 %u0112 %u0113 %u0114 %u0115 %u0116 %u0117 %u0118 %u0119 %u011a %u011b %u011c %u011d %u011e %u011f %u0120 %u0121 %u0122 %u0123 %u0124 %u0125 %u0126 %u0127 %u0128 %u0129 %u012a %u012b %u012c %u012d %u012e %u012f %u0130 %u0131 %u0132 %u0133 %u0134 %u0135 %u0136 %u0137 %u0138 %u0139 %u013a %u013b %u013c %u013d %u013e %u013f %u0140 %u0141 %u0142 %u0143 %u0144 %u0145 %u0146 %u0147 %u0148 %u0149 %u014a %u014b %u014c %u014d %u014e %u014f %u0150 %u0151 %u0152 %u0153 %u0154 %u0155 %u0156 %u0157 %u0158 %u0159 %u015a %u015b %u015c %u015d %u015e %u015f %u0160 %u0161 %u0162 %u0163 %u0164 %u0165 %u0166 %u0167 %u0168 %u0169 %u016a %u016b %u016c %u016d %u016e %u016f %u0170 %u0171 %u0172 %u0173 %u0174 %u0175 %u0176 %u0177 %u0178 %u0179 %u017a %u017b %u017c %u017d %u017e %u017f',
				'Ѐ Ё Ђ Ѓ Є Ѕ І Ї Ј Љ Њ Ћ Ќ Ѝ Ў Џ А Б В Г Д Е Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я а б в г д е ж з и й к л м н о п р с т у ф х ц ч ш щ ъ ы ь э ю я ѐ ё ђ ѓ є ѕ і ї ј љ њ ћ ќ ѝ ў џ Ѡ ѡ Ѣ ѣ Ѥ ѥ Ѧ ѧ Ѩ ѩ Ѫ ѫ Ѭ ѭ Ѯ ѯ Ѱ ѱ Ѳ ѳ Ѵ ѵ Ѷ ѷ Ѹ ѹ Ѻ ѻ Ѽ ѽ Ѿ ѿ Ҁ ҁ ҂ ҈ ҉ Ҋ ҋ Ҍ ҍ Ҏ ҏ Ґ ґ Ғ ғ Ҕ ҕ Җ җ Ҙ ҙ Қ қ Ҝ ҝ Ҟ ҟ Ҡ ҡ Ң ң Ҥ ҥ Ҧ ҧ Ҩ ҩ Ҫ ҫ Ҭ ҭ Ү ү Ұ ұ Ҳ ҳ Ҵ ҵ Ҷ ҷ Ҹ ҹ Һ һ Ҽ ҽ Ҿ ҿ Ӏ Ӂ ӂ Ӄ ӄ Ӆ ӆ Ӈ ӈ Ӊ ӊ Ӌ ӌ Ӎ ӎ ӏ Ӑ ӑ Ӓ ӓ Ӕ ӕ Ӗ ӗ Ә ә Ӛ ӛ Ӝ ӝ Ӟ ӟ Ӡ ӡ Ӣ ӣ Ӥ ӥ Ӧ ӧ Ө ө Ӫ ӫ Ӭ ӭ Ӯ ӯ Ӱ ӱ Ӳ ӳ Ӵ ӵ Ӷ ӷ Ӹ ӹ Ӻ ӻ Ӽ ӽ Ӿ ӿ ͵ ͺ ͻ ͼ ͽ ΄ ΅ Ά Έ Ή Ί Ό Ύ Ώ ΐ Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω Ϊ Ϋ ά έ ή ί ΰ α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ ς σ τ υ φ χ ψ ω ϊ ϋ ό ύ ώ ϐ ϑ ϒ ϓ ϔ ϕ ϖ ϗ Ϙ ϙ Ϛ ϛ Ϝ ϝ Ϟ ϟ Ϡ ϡ Ϣ ϣ Ϥ ϥ Ϧ ϧ Ϩ ϩ Ϫ ϫ Ϭ ϭ Ϯ ϯ ϰ ϱ ϲ ϳ ϴ ϵ ϶ Ϸ ϸ Ϲ Ϻ ϻ ϼ Ͻ Ͼ Ͽ ־ ׀ ׃ ׆ א ב ג ד ה ו ז ח ט י ך כ ל ם מ ן נ ס ע ף פ ץ צ ק ר ש ת װ ױ ײ ׳ ״' => '%u0400 %u0401 %u0402 %u0403 %u0404 %u0405 %u0406 %u0407 %u0408 %u0409 %u040a %u040b %u040c %u040d %u040e %u040f %u0410 %u0411 %u0412 %u0413 %u0414 %u0415 %u0416 %u0417 %u0418 %u0419 %u041a %u041b %u041c %u041d %u041e %u041f %u0420 %u0421 %u0422 %u0423 %u0424 %u0425 %u0426 %u0427 %u0428 %u0429 %u042a %u042b %u042c %u042d %u042e %u042f %u0430 %u0431 %u0432 %u0433 %u0434 %u0435 %u0436 %u0437 %u0438 %u0439 %u043a %u043b %u043c %u043d %u043e %u043f %u0440 %u0441 %u0442 %u0443 %u0444 %u0445 %u0446 %u0447 %u0448 %u0449 %u044a %u044b %u044c %u044d %u044e %u044f %u0450 %u0451 %u0452 %u0453 %u0454 %u0455 %u0456 %u0457 %u0458 %u0459 %u045a %u045b %u045c %u045d %u045e %u045f %u0460 %u0461 %u0462 %u0463 %u0464 %u0465 %u0466 %u0467 %u0468 %u0469 %u046a %u046b %u046c %u046d %u046e %u046f %u0470 %u0471 %u0472 %u0473 %u0474 %u0475 %u0476 %u0477 %u0478 %u0479 %u047a %u047b %u047c %u047d %u047e %u047f %u0480 %u0481 %u0482 %u0488 %u0489 %u048a %u048b %u048c %u048d %u048e %u048f %u0490 %u0491 %u0492 %u0493 %u0494 %u0495 %u0496 %u0497 %u0498 %u0499 %u049a %u049b %u049c %u049d %u049e %u049f %u04a0 %u04a1 %u04a2 %u04a3 %u04a4 %u04a5 %u04a6 %u04a7 %u04a8 %u04a9 %u04aa %u04ab %u04ac %u04ad %u04ae %u04af %u04b0 %u04b1 %u04b2 %u04b3 %u04b4 %u04b5 %u04b6 %u04b7 %u04b8 %u04b9 %u04ba %u04bb %u04bc %u04bd %u04be %u04bf %u04c0 %u04c1 %u04c2 %u04c3 %u04c4 %u04c5 %u04c6 %u04c7 %u04c8 %u04c9 %u04ca %u04cb %u04cc %u04cd %u04ce %u04cf %u04d0 %u04d1 %u04d2 %u04d3 %u04d4 %u04d5 %u04d6 %u04d7 %u04d8 %u04d9 %u04da %u04db %u04dc %u04dd %u04de %u04df %u04e0 %u04e1 %u04e2 %u04e3 %u04e4 %u04e5 %u04e6 %u04e7 %u04e8 %u04e9 %u04ea %u04eb %u04ec %u04ed %u04ee %u04ef %u04f0 %u04f1 %u04f2 %u04f3 %u04f4 %u04f5 %u04f6 %u04f7 %u04f8 %u04f9 %u04fa %u04fb %u04fc %u04fd %u04fe %u04ff %u0375 %u037a %u037b %u037c %u037d %u0384 %u0385 %u0386 %u0388 %u0389 %u038a %u038c %u038e %u038f %u0390 %u0391 %u0392 %u0393 %u0394 %u0395 %u0396 %u0397 %u0398 %u0399 %u039a %u039b %u039c %u039d %u039e %u039f %u03a0 %u03a1 %u03a3 %u03a4 %u03a5 %u03a6 %u03a7 %u03a8 %u03a9 %u03aa %u03ab %u03ac %u03ad %u03ae %u03af %u03b0 %u03b1 %u03b2 %u03b3 %u03b4 %u03b5 %u03b6 %u03b7 %u03b8 %u03b9 %u03ba %u03bb %u03bc %u03bd %u03be %u03bf %u03c0 %u03c1 %u03c2 %u03c3 %u03c4 %u03c5 %u03c6 %u03c7 %u03c8 %u03c9 %u03ca %u03cb %u03cc %u03cd %u03ce %u03d0 %u03d1 %u03d2 %u03d3 %u03d4 %u03d5 %u03d6 %u03d7 %u03d8 %u03d9 %u03da %u03db %u03dc %u03dd %u03de %u03df %u03e0 %u03e1 %u03e2 %u03e3 %u03e4 %u03e5 %u03e6 %u03e7 %u03e8 %u03e9 %u03ea %u03eb %u03ec %u03ed %u03ee %u03ef %u03f0 %u03f1 %u03f2 %u03f3 %u03f4 %u03f5 %u03f6 %u03f7 %u03f8 %u03f9 %u03fa %u03fb %u03fc %u03fd %u03fe %u03ff %u05be %u05c0 %u05c3 %u05c6 %u05d0 %u05d1 %u05d2 %u05d3 %u05d4 %u05d5 %u05d6 %u05d7 %u05d8 %u05d9 %u05da %u05db %u05dc %u05dd %u05de %u05df %u05e0 %u05e1 %u05e2 %u05e3 %u05e4 %u05e5 %u05e6 %u05e7 %u05e8 %u05e9 %u05ea %u05f0 %u05f1 %u05f2 %u05f3 %u05f4',
				'ب ة ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ـ ف ق ك ل م ن ه و ى ي ٖ ٗ ٘ ٙ ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ٪ ٫ ٬ ٭ ٮ ٯ ٱ ٲ ٳ ٴ ٵ ٶ ٷ ٸ ٹ ٺ ٻ ټ ٽ پ ٿ ڀ ځ ڂ ڃ ڄ څ چ ڇ ڈ ډ ڊ ڋ ڌ ڍ ڎ ڏ ڐ ڑ ڒ ړ ڔ ڕ ږ ڗ ژ ڙ ښ ڛ ڜ ڝ ڞ ڟ ڠ ڡ ڢ ڣ ڤ ڥ ڦ ڧ ڨ ک ڪ ګ ڬ ڭ ڮ گ ڰ ڱ ڲ ڳ ڴ ڵ ڶ ڷ ڸ ڹ ں ڻ ڼ ڽ ھ ڿ ۀ ہ ۂ ۃ ۄ ۅ ۆ ۇ ۈ ۉ ۊ ۋ ی ۍ ێ ۏ ې ۑ ے ۓ ۔ ە ۝ ۞ ۥ ۦ ۩ ۮ ۯ ۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹ ۺ ۻ ۼ ۽ ۾ ' => '%u0628 %u0629 %u062a %u062b %u062c %u062d %u062e %u062f %u0630 %u0631 %u0632 %u0633 %u0634 %u0635 %u0636 %u0637 %u0638 %u0639 %u063a %u0640 %u0641 %u0642 %u0643 %u0644 %u0645 %u0646 %u0647 %u0648 %u0649 %u064a %u0656 %u0657 %u0658 %u0659 %u0660 %u0661 %u0662 %u0663 %u0664 %u0665 %u0666 %u0667 %u0668 %u0669 %u066a %u066b %u066c %u066d %u066e %u066f %u0671 %u0672 %u0673 %u0674 %u0675 %u0676 %u0677 %u0678 %u0679 %u067a %u067b %u067c %u067d %u067e %u067f %u0680 %u0681 %u0682 %u0683 %u0684 %u0685 %u0686 %u0687 %u0688 %u0689 %u068a %u068b %u068c %u068d %u068e %u068f %u0690 %u0691 %u0692 %u0693 %u0694 %u0695 %u0696 %u0697 %u0698 %u0699 %u069a %u069b %u069c %u069d %u069e %u069f %u06a0 %u06a1 %u06a2 %u06a3 %u06a4 %u06a5 %u06a6 %u06a7 %u06a8 %u06a9 %u06aa %u06ab %u06ac %u06ad %u06ae %u06af %u06b0 %u06b1 %u06b2 %u06b3 %u06b4 %u06b5 %u06b6 %u06b7 %u06b8 %u06b9 %u06ba %u06bb %u06bc %u06bd %u06be %u06bf %u06c0 %u06c1 %u06c2 %u06c3 %u06c4 %u06c5 %u06c6 %u06c7 %u06c8 %u06c9 %u06ca %u06cb %u06cc %u06cd %u06ce %u06cf %u06d0 %u06d1 %u06d2 %u06d3 %u06d4 %u06d5 %u06dd %u06de %u06e5 %u06e6 %u06e9 %u06ee %u06ef %u06f0 %u06f1 %u06f2 %u06f3 %u06f4 %u06f5 %u06f6 %u06f7 %u06f8 %u06f9 %u06fa %u06fb %u06fc %u06fd %u06fe ',
				'■ □ ▢ ▣ ▤ ▥ ▦ ▧ ▨ ▩ ▪ ▫ ▬ ▭ ▮ ▯ ▰ ▱ ▲ △ ▴ ▵ ▶ ▷ ▸ ▹ ► ▻ ▼ ▽ ▾ ▿ ◀ ◁ ◂ ◃ ◄ ◅ ◆ ◇ ◈ ◉ ◊ ○ ◌ ◍ ◎ ● ◐ ◑ ◒ ◓ ◔ ◕ ◖ ◗ ◘ ◙ ◚ ◛ ◜ ◝ ◞ ◟ ◠ ◡ ◢ ◣ ◤ ◥ ◦ ◧ ◨ ◩ ◪ ◫ ◬ ◭ ◮ ◯ ◰ ◱ ◲ ◳ ◴ ◵ ◶ ◷ ◸ ◹ ◺ ◻ ◼ ◽ ◾ ◿' => '%u25a0 %u25a1 %u25a2 %u25a3 %u25a4 %u25a5 %u25a6 %u25a7 %u25a8 %u25a9 %u25aa %u25ab %u25ac %u25ad %u25ae %u25af %u25b0 %u25b1 %u25b2 %u25b3 %u25b4 %u25b5 %u25b6 %u25b7 %u25b8 %u25b9 %u25ba %u25bb %u25bc %u25bd %u25be %u25bf %u25c0 %u25c1 %u25c2 %u25c3 %u25c4 %u25c5 %u25c6 %u25c7 %u25c8 %u25c9 %u25ca %u25cb %u25cc %u25cd %u25ce %u25cf %u25d0 %u25d1 %u25d2 %u25d3 %u25d4 %u25d5 %u25d6 %u25d7 %u25d8 %u25d9 %u25da %u25db %u25dc %u25dd %u25de %u25df %u25e0 %u25e1 %u25e2 %u25e3 %u25e4 %u25e5 %u25e6 %u25e7 %u25e8 %u25e9 %u25ea %u25eb %u25ec %u25ed %u25ee %u25ef %u25f0 %u25f1 %u25f2 %u25f3 %u25f4 %u25f5 %u25f6 %u25f7 %u25f8 %u25f9 %u25fa %u25fb %u25fc %u25fd %u25fe %u25ff',
				' ✁ ✂ ✃ ✄ ✅ ✆ ✇ ✈ ✉ ✊ ✋ ✌ ✍ ✎ ✏ ✐ ✑ ✒ ✓ ✔ ✕ ✖ ✗ ✘ ✙ ✚ ✛ ✜ ✝ ✞ ✟ ✠ ✡ ✢ ✣ ✤ ✥ ✦ ✧ ✨ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰ ✱ ✲ ✳ ✴ ✵ ✶ ✷ ✸ ✹ ✺ ✻ ✼ ✽ ✾ ✿ ❀ ❁ ❂ ❃ ❄ ❅ ❆ ❇ ❈ ❉ ❊ ❋ ❌ ❍ ❎ ❏ ❐ ❑ ❒ ❓ ❔ ❕ ❖ ❗ ❘ ❙ ❚ ❛ ❜ ❝ ❣ ❤ ❥ ❦ ❧ ❨ ❩ ❪ ❫ ❬ ❭ ❮ ❯ ❰ ❱ ❲ ❳ ❴ ❵ ❶ ❷ ❸ ❹ ❺ ❻ ❼ ❽ ❾ ❿ ➀ ➁ ➂ ➃ ➄ ➅ ➆ ➇ ➈ ➉ ➊ ➋ ➌ ➍ ➎ ➏ ➐ ➑ ➒ ➓ ➔ ➘ ➙ ➚ ➛ ➜ ➝ ➞ ➟ ➠ ➡ ➢ ➣ ➤ ➥ ➦ ➧ ➨ ➩ ➪ ➫ ➬ ➭ ➮ ➯ ➰ ➱ ➲ ➳ ➴ ➵ ➶ ➷ ➸ ➹ ➺ ➻ ➼ ➽ ➾ ➿' => ' %u2701 %u2702 %u2703 %u2704 %u2705 %u2706 %u2707 %u2708 %u2709 %u270a %u270b %u270c %u270d %u270e %u270f %u2710 %u2711 %u2712 %u2713 %u2714 %u2715 %u2716 %u2717 %u2718 %u2719 %u271a %u271b %u271c %u271d %u271e %u271f %u2720 %u2721 %u2722 %u2723 %u2724 %u2725 %u2726 %u2727 %u2728 %u2729 %u272a %u272b %u272c %u272d %u272e %u272f %u2730 %u2731 %u2732 %u2733 %u2734 %u2735 %u2736 %u2737 %u2738 %u2739 %u273a %u273b %u273c %u273d %u273e %u273f %u2740 %u2741 %u2742 %u2743 %u2744 %u2745 %u2746 %u2747 %u2748 %u2749 %u274a %u274b %u274c %u274d %u274e %u274f %u2750 %u2751 %u2752 %u2753 %u2754 %u2755 %u2756 %u2757 %u2758 %u2759 %u275a %u275b %u275c %u275d %u2763 %u2764 %u2765 %u2766 %u2767 %u2768 %u2769 %u276a %u276b %u276c %u276d %u276e %u276f %u2770 %u2771 %u2772 %u2773 %u2774 %u2775 %u2776 %u2777 %u2778 %u2779 %u277a %u277b %u277c %u277d %u277e %u277f %u2780 %u2781 %u2782 %u2783 %u2784 %u2785 %u2786 %u2787 %u2788 %u2789 %u278a %u278b %u278c %u278d %u278e %u278f %u2790 %u2791 %u2792 %u2793 %u2794 %u2798 %u2799 %u279a %u279b %u279c %u279d %u279e %u279f %u27a0 %u27a1 %u27a2 %u27a3 %u27a4 %u27a5 %u27a6 %u27a7 %u27a8 %u27a9 %u27aa %u27ab %u27ac %u27ad %u27ae %u27af %u27b0 %u27b1 %u27b2 %u27b3 %u27b4 %u27b5 %u27b6 %u27b7 %u27b8 %u27b9 %u27ba %u27bb %u27bc %u27bd %u27be %u27bf',
				' ⟀ ⟁ ⟂ ⟃ ⟄ ⟅ ⟆ ⟇ ⟈ ⟉ ⟊ ⟌ ⟐ ⟑ ⟒ ⟓ ⟔ ⟕ ⟖ ⟗ ⟘ ⟙ ⟚ ⟛ ⟜ ⟝ ⟞ ⟟ ⟠ ⟡ ⟢ ⟣ ⟤ ⟥ ⟦ ⟧ ⟨ ⟩ ⟪ ⟫ ⟬ ⟭ ⟮ ⟯' => ' %u27c0 %u27c1 %u27c2 %u27c3 %u27c4 %u27c5 %u27c6 %u27c7 %u27c8 %u27c9 %u27ca %u27cc %u27d0 %u27d1 %u27d2 %u27d3 %u27d4 %u27d5 %u27d6 %u27d7 %u27d8 %u27d9 %u27da %u27db %u27dc %u27dd %u27de %u27df %u27e0 %u27e1 %u27e2 %u27e3 %u27e4 %u27e5 %u27e6 %u27e7 %u27e8 %u27e9 %u27ea %u27eb %u27ec %u27ed %u27ee %u27ef',
				' ⟰ ⟱ ⟲ ⟳ ⟴ ⟵ ⟶ ⟷ ⟸ ⟹ ⟺ ⟻ ⟼ ⟽ ⟾ ⟿' => ' %u27f0 %u27f1 %u27f2 %u27f3 %u27f4 %u27f5 %u27f6 %u27f7 %u27f8 %u27f9 %u27fa %u27fb %u27fc %u27fd %u27fe %u27ff',
			),
		);
	}
}
