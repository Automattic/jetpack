-- Tables and MySQL schema rows that the SQLite driver writes for TranslatePress and Solid Security (iThemes) on a Studio site.
CREATE TABLE `wp_trp_gettext_original_strings` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  `original` TEXT COLLATE NOCASE NOT NULL,
  `domain` TEXT COLLATE NOCASE NOT NULL,
  `context` TEXT COLLATE NOCASE,
  `original_plural` TEXT COLLATE NOCASE,
  `lookup_hash` TEXT COLLATE NOCASE NOT NULL
) STRICT;
CREATE INDEX `wp_trp_gettext_original_strings__gettext_index_original` ON `wp_trp_gettext_original_strings` (`original`);
CREATE INDEX `wp_trp_gettext_original_strings__gettext_lookup_original_domain_context` ON `wp_trp_gettext_original_strings` (`original`, `domain`, `context`);
CREATE UNIQUE INDEX `wp_trp_gettext_original_strings__gettext_lookup_hash_unique` ON `wp_trp_gettext_original_strings` (`lookup_hash`);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_trp_gettext_original_strings','id',1,NULL,'NO','bigint',NULL,NULL,19,0,NULL,NULL,NULL,'bigint(20)','PRI','auto_increment','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_trp_gettext_original_strings','original',2,NULL,'NO','text',65535,65535,NULL,NULL,NULL,'utf8mb4','utf8mb4_0900_ai_ci','text','MUL','','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_trp_gettext_original_strings','domain',3,NULL,'NO','text',65535,65535,NULL,NULL,NULL,'utf8mb4','utf8mb4_0900_ai_ci','text','','','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_trp_gettext_original_strings','context',4,NULL,'YES','text',65535,65535,NULL,NULL,NULL,'utf8mb4','utf8mb4_0900_ai_ci','text','','','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_trp_gettext_original_strings','original_plural',5,NULL,'YES','text',65535,65535,NULL,NULL,NULL,'utf8mb4','utf8mb4_0900_ai_ci','text','','','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_trp_gettext_original_strings','lookup_hash',6,NULL,'NO','char',32,128,NULL,NULL,NULL,'utf8mb4','utf8mb4_0900_ai_ci','char(32)','UNI','','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_trp_gettext_original_strings',0,'sqlite_database','PRIMARY',1,'id','A',0,NULL,NULL,'','BTREE','','','YES',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_trp_gettext_original_strings',1,'sqlite_database','gettext_index_original',1,'original','A',0,100,NULL,'','BTREE','','','YES',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_trp_gettext_original_strings',1,'sqlite_database','gettext_lookup_original_domain_context',1,'original','A',0,100,NULL,'','BTREE','','','YES',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_trp_gettext_original_strings',1,'sqlite_database','gettext_lookup_original_domain_context',2,'domain','A',0,100,NULL,'','BTREE','','','YES',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_trp_gettext_original_strings',1,'sqlite_database','gettext_lookup_original_domain_context',3,'context','A',0,100,NULL,'YES','BTREE','','','YES',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_trp_gettext_original_strings',0,'sqlite_database','gettext_lookup_hash_unique',1,'lookup_hash','A',0,NULL,NULL,'','BTREE','','','YES',NULL);
CREATE TABLE `wp_itsec_dashboard_events` (
  `event_id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  `event_slug` TEXT COLLATE NOCASE NOT NULL DEFAULT '',
  `event_time` TEXT COLLATE NOCASE NOT NULL,
  `event_count` INTEGER NOT NULL DEFAULT '1',
  `event_consolidated` INTEGER NOT NULL DEFAULT '0'
) STRICT;
CREATE UNIQUE INDEX `wp_itsec_dashboard_events__event_slug__time__consolidated` ON `wp_itsec_dashboard_events` (`event_slug`, `event_time`, `event_consolidated`);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_itsec_dashboard_events','event_id',1,NULL,'NO','int',NULL,NULL,10,0,NULL,NULL,NULL,'int(11) unsigned','PRI','auto_increment','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_itsec_dashboard_events','event_slug',2,'','NO','varchar',128,512,NULL,NULL,NULL,'utf8mb4','utf8mb4_0900_ai_ci','varchar(128)','UNI','','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_itsec_dashboard_events','event_time',3,NULL,'NO','datetime',NULL,NULL,NULL,NULL,0,NULL,NULL,'datetime','','','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_itsec_dashboard_events','event_count',4,'1','NO','int',NULL,NULL,10,0,NULL,NULL,NULL,'int(11) unsigned','','','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_columns VALUES('def','sqlite_database','wp_itsec_dashboard_events','event_consolidated',5,'0','NO','tinyint',NULL,NULL,3,0,NULL,NULL,NULL,'tinyint(1)','','','select,insert,update,references','','',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_itsec_dashboard_events',0,'sqlite_database','PRIMARY',1,'event_id','A',0,NULL,NULL,'','BTREE','','','YES',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_itsec_dashboard_events',0,'sqlite_database','event_slug__time__consolidated',1,'event_slug','A',0,NULL,NULL,'','BTREE','','','YES',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_itsec_dashboard_events',0,'sqlite_database','event_slug__time__consolidated',2,'event_time','A',0,NULL,NULL,'','BTREE','','','YES',NULL);
INSERT INTO _wp_sqlite_mysql_information_schema_statistics VALUES('def','sqlite_database','wp_itsec_dashboard_events',0,'sqlite_database','event_slug__time__consolidated',3,'event_consolidated','A',0,NULL,NULL,'','BTREE','','','YES',NULL);
