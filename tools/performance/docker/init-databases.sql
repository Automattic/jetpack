-- Initialize databases for the matched WordPress instances
CREATE DATABASE IF NOT EXISTS wp_jetpack_connected;
CREATE DATABASE IF NOT EXISTS wp_no_jetpack;

-- Grant permissions
GRANT ALL PRIVILEGES ON wp_jetpack_connected.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON wp_no_jetpack.* TO 'root'@'%';
FLUSH PRIVILEGES;
