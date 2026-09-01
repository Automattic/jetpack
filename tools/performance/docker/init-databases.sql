-- Initialize database for Jetpack connected WordPress instance
CREATE DATABASE IF NOT EXISTS wp_jetpack_connected;

-- Grant permissions
GRANT ALL PRIVILEGES ON wp_jetpack_connected.* TO 'root'@'%';
FLUSH PRIVILEGES;
