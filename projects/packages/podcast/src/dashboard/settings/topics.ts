// Apple Podcasts category list. Source: https://help.apple.com/itc/podcasts_connect/#/itc9267a2f12.
// Stored as `"Primary"` or `"Primary,Subtopic"` to match `<itunes:category>` emission.

import { _x } from '@wordpress/i18n';

export interface Topic {
	key: string;
	label: string;
	subtopics: Array< { key: string; label: string } >;
}

export const TOPICS: readonly Topic[] = [
	{
		key: 'Arts',
		label: _x( 'Arts', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{ key: 'Books', label: _x( 'Books', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Design', label: _x( 'Design', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Fashion & Beauty',
				label: _x( 'Fashion & Beauty', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Food', label: _x( 'Food', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Performing Arts',
				label: _x( 'Performing Arts', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Visual Arts',
				label: _x( 'Visual Arts', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
	{
		key: 'Business',
		label: _x( 'Business', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{ key: 'Careers', label: _x( 'Careers', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Entrepreneurship',
				label: _x( 'Entrepreneurship', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Investing', label: _x( 'Investing', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Management', label: _x( 'Management', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Marketing', label: _x( 'Marketing', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Non-Profit', label: _x( 'Non-Profit', 'podcasting category', 'jetpack-podcast' ) },
		],
	},
	{
		key: 'Comedy',
		label: _x( 'Comedy', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{
				key: 'Comedy Interviews',
				label: _x( 'Comedy Interviews', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Improv', label: _x( 'Improv', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Stand-Up', label: _x( 'Stand-Up', 'podcasting category', 'jetpack-podcast' ) },
		],
	},
	{
		key: 'Education',
		label: _x( 'Education', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{ key: 'Courses', label: _x( 'Courses', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'How To', label: _x( 'How To', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Language Learning',
				label: _x( 'Language Learning', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Self-Improvement',
				label: _x( 'Self-Improvement', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
	{
		key: 'Fiction',
		label: _x( 'Fiction', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{
				key: 'Comedy Fiction',
				label: _x( 'Comedy Fiction', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Drama', label: _x( 'Drama', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Science Fiction',
				label: _x( 'Science Fiction', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
	{
		key: 'Government',
		label: _x( 'Government', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [],
	},
	{
		key: 'History',
		label: _x( 'History', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [],
	},
	{
		key: 'Health & Fitness',
		label: _x( 'Health & Fitness', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{
				key: 'Alternative Health',
				label: _x( 'Alternative Health', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Fitness', label: _x( 'Fitness', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Medicine', label: _x( 'Medicine', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Mental Health',
				label: _x( 'Mental Health', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Nutrition', label: _x( 'Nutrition', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Sexuality', label: _x( 'Sexuality', 'podcasting category', 'jetpack-podcast' ) },
		],
	},
	{
		key: 'Kids & Family',
		label: _x( 'Kids & Family', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{
				key: 'Education for Kids',
				label: _x( 'Education for Kids', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Parenting', label: _x( 'Parenting', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Pets & Animals',
				label: _x( 'Pets & Animals', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Stories for Kids',
				label: _x( 'Stories for Kids', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
	{
		key: 'Leisure',
		label: _x( 'Leisure', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{
				key: 'Animation & Manga',
				label: _x( 'Animation & Manga', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Automotive',
				label: _x( 'Automotive', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Aviation', label: _x( 'Aviation', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Crafts', label: _x( 'Crafts', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Games', label: _x( 'Games', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Hobbies', label: _x( 'Hobbies', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Home & Garden',
				label: _x( 'Home & Garden', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Video Games',
				label: _x( 'Video Games', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
	{
		key: 'Music',
		label: _x( 'Music', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{
				key: 'Music Commentary',
				label: _x( 'Music Commentary', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Music History',
				label: _x( 'Music History', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Music Interviews',
				label: _x( 'Music Interviews', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
	{
		key: 'News',
		label: _x( 'News', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{
				key: 'Business News',
				label: _x( 'Business News', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Daily News',
				label: _x( 'Daily News', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Entertainment News',
				label: _x( 'Entertainment News', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'News Commentary',
				label: _x( 'News Commentary', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Politics', label: _x( 'Politics', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Sports News',
				label: _x( 'Sports News', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Tech News', label: _x( 'Tech News', 'podcasting category', 'jetpack-podcast' ) },
		],
	},
	{
		key: 'Religion & Spirituality',
		label: _x( 'Religion & Spirituality', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{ key: 'Buddhism', label: _x( 'Buddhism', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Christianity',
				label: _x( 'Christianity', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Hinduism', label: _x( 'Hinduism', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Islam', label: _x( 'Islam', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Judaism', label: _x( 'Judaism', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Religion', label: _x( 'Religion', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Spirituality',
				label: _x( 'Spirituality', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
	{
		key: 'Science',
		label: _x( 'Science', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{ key: 'Astronomy', label: _x( 'Astronomy', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Chemistry', label: _x( 'Chemistry', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Earth Sciences',
				label: _x( 'Earth Sciences', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Life Sciences',
				label: _x( 'Life Sciences', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Mathematics',
				label: _x( 'Mathematics', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Natural Sciences',
				label: _x( 'Natural Sciences', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Nature', label: _x( 'Nature', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Physics', label: _x( 'Physics', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Social Sciences',
				label: _x( 'Social Sciences', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
	{
		key: 'Society & Culture',
		label: _x( 'Society & Culture', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{
				key: 'Documentary',
				label: _x( 'Documentary', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Personal Journals',
				label: _x( 'Personal Journals', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Philosophy', label: _x( 'Philosophy', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Places & Travel',
				label: _x( 'Places & Travel', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Relationships',
				label: _x( 'Relationships', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
	{
		key: 'Sports',
		label: _x( 'Sports', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{ key: 'Baseball', label: _x( 'Baseball', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Basketball', label: _x( 'Basketball', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Cricket', label: _x( 'Cricket', 'podcasting category', 'jetpack-podcast' ) },
			{
				key: 'Fantasy Sports',
				label: _x( 'Fantasy Sports', 'podcasting category', 'jetpack-podcast' ),
			},
			{ key: 'Football', label: _x( 'Football', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Golf', label: _x( 'Golf', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Hockey', label: _x( 'Hockey', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Rugby', label: _x( 'Rugby', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Running', label: _x( 'Running', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Soccer', label: _x( 'Soccer', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Swimming', label: _x( 'Swimming', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Tennis', label: _x( 'Tennis', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Volleyball', label: _x( 'Volleyball', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Wilderness', label: _x( 'Wilderness', 'podcasting category', 'jetpack-podcast' ) },
			{ key: 'Wrestling', label: _x( 'Wrestling', 'podcasting category', 'jetpack-podcast' ) },
		],
	},
	{
		key: 'Technology',
		label: _x( 'Technology', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [],
	},
	{
		key: 'True Crime',
		label: _x( 'True Crime', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [],
	},
	{
		key: 'TV & Film',
		label: _x( 'TV & Film', 'podcasting category', 'jetpack-podcast' ),
		subtopics: [
			{
				key: 'After Shows',
				label: _x( 'After Shows', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Film History',
				label: _x( 'Film History', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Film Interviews',
				label: _x( 'Film Interviews', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'Film Reviews',
				label: _x( 'Film Reviews', 'podcasting category', 'jetpack-podcast' ),
			},
			{
				key: 'TV Reviews',
				label: _x( 'TV Reviews', 'podcasting category', 'jetpack-podcast' ),
			},
		],
	},
];
