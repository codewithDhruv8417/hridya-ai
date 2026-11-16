-- ============================================
-- MENTAL HEALTH DATABASE
-- COMPLETE SQL SCHEMA (12 TABLES)
-- ============================================

CREATE DATABASE IF NOT EXISTS mental_health_db;

USE mental_health_db;


-- ============================================
-- 1. USERS
-- ============================================

CREATE TABLE `users` (
    `user_id` INT NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `email` VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
    `password_hash` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `phone` VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `role` ENUM('user','therapist','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
    `preferred_language` VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT 'English',
    `account_status` ENUM('active','inactive','blocked') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 2. THERAPIST PROFILES
-- ============================================

CREATE TABLE `therapist_profiles` (
    `therapist_id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `qualification` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `license_number` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `experience_years` INT DEFAULT '0',
    `bio` TEXT COLLATE utf8mb4_unicode_ci,
    `consultation_fee` DECIMAL(10,2) DEFAULT NULL,
    `session_mode` ENUM('online','offline','both') COLLATE utf8mb4_unicode_ci DEFAULT 'both',
    `verification_status` ENUM('pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`therapist_id`),
    UNIQUE KEY `user_id` (`user_id`),
    UNIQUE KEY `license_number` (`license_number`),
    CONSTRAINT `fk_therapist_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 3. SPECIALIZATIONS
-- ============================================

CREATE TABLE `specializations` (
    `specialization_id` INT NOT NULL AUTO_INCREMENT,
    `specialization_name` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` TEXT COLLATE utf8mb4_unicode_ci,
    PRIMARY KEY (`specialization_id`),
    UNIQUE KEY `specialization_name` (`specialization_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 4. THERAPIST SPECIALIZATIONS
-- ============================================

CREATE TABLE `therapist_specializations` (
    `therapist_id` INT NOT NULL,
    `specialization_id` INT NOT NULL,
    PRIMARY KEY (`therapist_id`, `specialization_id`),
    KEY `specialization_id` (`specialization_id`),
    CONSTRAINT `therapist_specializations_ibfk_1`
        FOREIGN KEY (`therapist_id`) REFERENCES `therapist_profiles` (`therapist_id`) ON DELETE CASCADE,
    CONSTRAINT `therapist_specializations_ibfk_2`
        FOREIGN KEY (`specialization_id`) REFERENCES `specializations` (`specialization_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 5. QUESTIONNAIRES
-- ============================================

CREATE TABLE `questionnaires` (
    `questionnaire_id` INT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` TEXT COLLATE utf8mb4_unicode_ci,
    `version` VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT '1.0',
    `is_active` TINYINT(1) DEFAULT '1',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`questionnaire_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 6. QUESTIONS
-- ============================================

CREATE TABLE `questions` (
    `question_id` INT NOT NULL AUTO_INCREMENT,
    `questionnaire_id` INT NOT NULL,
    `question_text` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
    `question_type` ENUM('multiple_choice','scale','text') COLLATE utf8mb4_unicode_ci DEFAULT 'multiple_choice',
    `display_order` INT NOT NULL,
    `is_required` TINYINT(1) DEFAULT '1',
    PRIMARY KEY (`question_id`),
    KEY `questionnaire_id` (`questionnaire_id`),
    CONSTRAINT `questions_ibfk_1`
        FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires` (`questionnaire_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 7. MODEL VERSIONS
-- ============================================

CREATE TABLE `model_versions` (
    `model_id` INT NOT NULL AUTO_INCREMENT,
    `model_name` VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
    `model_version` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
    `algorithm` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `accuracy` DECIMAL(5,2) DEFAULT NULL,
    `model_path` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT '1',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`model_id`),
    UNIQUE KEY `model_name` (`model_name`, `model_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 8. CHAT SESSIONS
-- ============================================

CREATE TABLE `chat_sessions` (
    `chat_session_id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `session_title` VARCHAR(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `started_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `ended_at` TIMESTAMP NULL DEFAULT NULL,
    `status` ENUM('active','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
    PRIMARY KEY (`chat_session_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `chat_sessions_ibfk_1`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 9. CHAT MESSAGES
-- ============================================

CREATE TABLE `chat_messages` (
    `message_id` INT NOT NULL AUTO_INCREMENT,
    `chat_session_id` INT NOT NULL,
    `sender` ENUM('user','assistant') COLLATE utf8mb4_unicode_ci NOT NULL,
    `message_text` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
    `sent_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`message_id`),
    KEY `chat_session_id` (`chat_session_id`),
    CONSTRAINT `chat_messages_ibfk_1`
        FOREIGN KEY (`chat_session_id`) REFERENCES `chat_sessions` (`chat_session_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 10. ASSESSMENT SESSIONS
-- ============================================

CREATE TABLE `assessment_sessions` (
    `assessment_id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `questionnaire_id` INT NOT NULL,
    `started_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    `status` ENUM('in_progress','completed','abandoned') COLLATE utf8mb4_unicode_ci DEFAULT 'in_progress',
    PRIMARY KEY (`assessment_id`),
    KEY `user_id` (`user_id`),
    KEY `questionnaire_id` (`questionnaire_id`),
    CONSTRAINT `assessment_sessions_ibfk_1`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
    CONSTRAINT `assessment_sessions_ibfk_2`
        FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires` (`questionnaire_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 11. ASSESSMENT RESULTS
-- ============================================

CREATE TABLE `assessment_results` (
    `result_id` INT NOT NULL AUTO_INCREMENT,
    `assessment_id` INT NOT NULL,
    `model_id` INT NOT NULL,
    `predicted_category` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `prediction_score` DECIMAL(6,3) DEFAULT NULL,
    `risk_level` ENUM('low','moderate','high','unknown') COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
    `medgemma_explanation` TEXT COLLATE utf8mb4_unicode_ci,
    `predicted_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`result_id`),
    UNIQUE KEY `assessment_id` (`assessment_id`),
    KEY `model_id` (`model_id`),
    CONSTRAINT `assessment_results_ibfk_1`
        FOREIGN KEY (`assessment_id`) REFERENCES `assessment_sessions` (`assessment_id`),
    CONSTRAINT `assessment_results_ibfk_2`
        FOREIGN KEY (`model_id`) REFERENCES `model_versions` (`model_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 12. ASSESSMENT RESPONSES
-- ============================================

CREATE TABLE `assessment_responses` (
    `response_id` INT NOT NULL AUTO_INCREMENT,
    `assessment_id` INT NOT NULL,
    `question_id` INT NOT NULL,
    `answer_text` TEXT COLLATE utf8mb4_unicode_ci,
    `answer_score` DECIMAL(6,2) DEFAULT NULL,
    `answered_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`response_id`),
    UNIQUE KEY `assessment_id` (`assessment_id`, `question_id`),
    KEY `question_id` (`question_id`),
    CONSTRAINT `assessment_responses_ibfk_1`
        FOREIGN KEY (`assessment_id`) REFERENCES `assessment_sessions` (`assessment_id`),
    CONSTRAINT `assessment_responses_ibfk_2`
        FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- VERIFY ALL 12 TABLES
-- ============================================

SHOW TABLES;