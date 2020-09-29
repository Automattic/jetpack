<?php

/**
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Twitter\Text\Configuration;

/**
 * Twitter Text Configuration Unit Tests
 *
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */
class ConfigurationTest extends TestCase
{
    /**
     * @var Configuration
     */
    private $config;

    /**
     * Set up fixtures
     *
     * @return void
     */
    protected function setUp()
    {
        $this->config = new Configuration();
    }

    /**
     * Tears down fixtures
     *
     * @return void
     */
    protected function tearDown()
    {
        unset($this->config);
    }

    /**
     * read configuration file from twitter-text
     *
     * @param string $version 'v1', 'v2' or 'v3'
     * @return string
     */
    private function readConfigJson($version = 'v3')
    {
        return file_get_contents(CONFIG . "/$version.json");
    }

    /**
     * get configuration array from twitter-text
     *
     * @param string $version 'v1', 'v2' or 'v3'
     * @return array
     */
    private function getConfiguration($version = 'v3')
    {
        return json_decode($this->readConfigJson($version), true);
    }

    /**
     * test for construct
     *
     * @return void
     */
    public function testConstruct()
    {
        $this->assertSame(3, $this->config->version);
    }

    /**
     * test for construct
     *
     * @return void
     */
    public function testConstructWithConfiguration()
    {
        $input = $this->getConfiguration('v1');
        $config = new Configuration($input);

        $this->assertSame(1, $config->version);
        $this->assertSame(140, $config->maxWeightedTweetLength);
        $this->assertSame(1, $config->scale);
        $this->assertSame(1, $config->defaultWeight);
        $this->assertSame(23, $config->transformedURLLength);
        $this->assertSame(array(), $config->ranges);
    }

    /**
     * test for toArray
     *
     * @return void
     */
    public function testToArray()
    {
        $config = $this->getConfiguration();
        $this->assertSame($config, $this->config->toArray());
    }

    /**
     * test for Configuration::fromJson
     *
     * @return void
     */
    public function testCreateFromJson()
    {
        $v3Config = Configuration::fromJson($this->readConfigJson('v3'));
        $this->assertSame($this->getConfiguration('v3'), $v3Config->toArray());

        $v2Config = Configuration::fromJson($this->readConfigJson('v2'));
        $this->assertSame($this->getConfiguration('v2'), $v2Config->toArray());

        $v1Config = Configuration::fromJson($this->readConfigJson('v1'));
        $this->assertSame($this->getConfiguration('v1'), $v1Config->toArray());
    }

    /**
     * test for Configuration::v1
     *
     * @return void
     */
    public function testV1Configuration()
    {
        $config = Configuration::v1();

        $this->assertSame(1, $config->version);
        $this->assertSame(140, $config->maxWeightedTweetLength);
        $this->assertSame(1, $config->scale);
        $this->assertSame(1, $config->defaultWeight);
        $this->assertSame(23, $config->transformedURLLength);
        $this->assertSame(array(), $config->ranges);
        $this->assertFalse($config->getEmojiParsingEnabled());
    }

    /**
     * test for Configuration::v2
     *
     * @return void
     */
    public function testV2Configuration()
    {
        $config = Configuration::v2();

        $this->assertSame(2, $config->version);
        $this->assertSame(280, $config->maxWeightedTweetLength);
        $this->assertSame(100, $config->scale);
        $this->assertSame(200, $config->defaultWeight);
        $this->assertSame(23, $config->transformedURLLength);
        $this->assertSame(array(
            array(
                'start' => 0,
                'end' => 4351,
                'weight' => 100,
            ),
            array(
                'start' => 8192,
                'end' => 8205,
                'weight' => 100,
            ),
            array(
                'start' => 8208,
                'end' => 8223,
                'weight' => 100,
            ),
            array(
                'start' => 8242,
                'end' => 8247,
                'weight' => 100,
            ),
        ), $config->ranges);
        $this->assertFalse($config->getEmojiParsingEnabled());
    }

    /**
     * test for getScaledMaxWeightedTweetLength
     *
     * @return void
     */
    public function testGetScaledMaxWeightedTweetLength()
    {
        $this->assertSame(28000, $this->config->getScaledMaxWeightedTweetLength());
    }

    /**
     * test for getScaledTransformedUrlWeight
     *
     * @return void
     */
    public function testGetScaledTransformedURLLength()
    {
        $this->assertSame(2300, $this->config->getScaledTransformedURLLength());
    }

    /**
     * test for getEmojiParsingEnabled
     *
     * @return void
     */
    public function testGetEmojiParsingEnabled()
    {
        $this->assertTrue($this->config->getEmojiParsingEnabled());
    }
}
