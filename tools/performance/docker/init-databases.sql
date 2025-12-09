-- Initialize databases for all four WordPress instances
CREATE DATABASE IF NOT EXISTS wp_baseline;
CREATE DATABASE IF NOT EXISTS wp_jetpack;
CREATE DATABASE IF NOT EXISTS wp_jetpack_offline;
CREATE DATABASE IF NOT EXISTS wp_jetpack_connected;

-- Grant permissions
GRANT ALL PRIVILEGES ON wp_baseline.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON wp_jetpack.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON wp_jetpack_offline.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON wp_jetpack_connected.* TO 'root'@'%';
FLUSH PRIVILEGES;
