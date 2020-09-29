<?php

/**
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright 2010, Mike Cochrane, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Yaml;
use Twitter\Text\Extractor;

/**
 * Twitter Conformance TestCase (tlds)
 *
 * @author     Takashi Nojima <nojimage@gmail.com>
 * @copyright  Copyright 2017, Takashi Nojima
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 * @property Extractor $extractor
 */
class TldConformanceTest extends TestCase
{
    protected function setUp()
    {
        parent::setUp();
        $this->extractor = new Extractor();
    }

    protected function tearDown()
    {
        unset($this->extractor);
        parent::tearDown();
    }

    /**
     * A helper function for providers.
     *
     * @param string $type  The test to fetch data from.
     * @param string $test  The test to fetch data for.
     * @return array  The test data to provide.
     */
    protected function providerHelper($type, $test)
    {
        $yamlParseMethod = 'parseFile';
        if (!method_exists('\Symfony\Component\Yaml\Yaml', $yamlParseMethod)) {
            $yamlParseMethod = 'parse';
        }
        $data = Yaml::$yamlParseMethod(DATA . '/' . $type . '.yml');

        return isset($data['tests'][$test]) ? $data['tests'][$test] : array();
    }

    /**
     * @group conformance
     * @group Extractor
     * @group tld
     * @group cctld
     * @dataProvider ccTLDUrlProvider
     */
    public function testCcTLDURL($description, $text, $expected)
    {
        $extracted = $this->extractor->extractURLs($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function ccTLDUrlProvider()
    {
        return $this->providerHelper('tlds', 'country');
    }

    /**
     * @group conformance
     * @group Extractor
     * @group tld
     * @group gtld
     * @dataProvider gTLDUrlProvider
     */
    public function testgTLDURL($description, $text, $expected)
    {
        $extracted = $this->extractor->extractURLs($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function gTLDUrlProvider()
    {
        return $this->providerHelper('tlds', 'generic');
    }
}
