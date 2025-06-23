-- Add missing columns to refresh_tokens table
ALTER TABLE `refresh_tokens` 
ADD COLUMN `ip_address` VARCHAR(45) NULL AFTER `expires_at`,
ADD COLUMN `user_agent` TEXT NULL AFTER `ip_address`;

-- Show the updated table structure
DESCRIBE refresh_tokens;