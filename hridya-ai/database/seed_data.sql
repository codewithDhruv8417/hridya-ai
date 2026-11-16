-- ============================================================================
-- MENTAL HEALTH DATABASE
-- SAMPLE SEED DATA (seed.sql)
-- ============================================================================

USE mental_health_db;


-- ============================================================================
-- 1. USERS
-- ============================================================================

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `phone`, `role`, `preferred_language`, `account_status`) VALUES
(1, 'Aarav Sharma', 'aarav.sharma@example.com', '$2y$10$hashedpassword1', '+91-9876543210', 'user', 'English', 'active'),
(2, 'Priya Verma', 'priya.verma@example.com', '$2y$10$hashedpassword2', '+91-9876543211', 'user', 'Hindi', 'active'),
(3, 'Rohan Mehta', 'rohan.mehta@example.com', '$2y$10$hashedpassword3', '+91-9876543212', 'user', 'English', 'active'),
(4, 'Dr. Ananya Nair', 'dr.ananya@example.com', '$2y$10$hashedpassword4', '+91-9876543213', 'therapist', 'English', 'active'),
(5, 'Dr. Vikram Sethi', 'dr.vikram@example.com', '$2y$10$hashedpassword5', '+91-9876543214', 'therapist', 'Hindi', 'active'),
(6, 'Dr. Meera Kapoor', 'dr.meera@example.com', '$2y$10$hashedpassword6', '+91-9876543215', 'therapist', 'English', 'active'),
(7, 'System Admin', 'admin@mentalhealth.org', '$2y$10$hashedpassword7', '+91-9000000000', 'admin', 'English', 'active');


-- ============================================================================
-- 2. THERAPIST PROFILES
-- ============================================================================

INSERT INTO `therapist_profiles` (`therapist_id`, `user_id`, `qualification`, `license_number`, `experience_years`, `bio`, `consultation_fee`, `session_mode`, `verification_status`) VALUES
(1, 4, 'M.Phil in Clinical Psychology', 'RCI-A10293', 8, 'Specializes in cognitive behavioral therapy for anxiety and workplace burnout.', 1200.00, 'both', 'verified'),
(2, 5, 'MD Psychiatry', 'MCI-B48291', 12, 'Experienced psychiatrist focusing on mood disorders, depression, and sleep issues.', 1500.00, 'online', 'verified'),
(3, 6, 'MA in Counseling Psychology', 'RCI-C99301', 4, 'Helps young adults navigate stress, trauma, and relationship challenges.', 800.00, 'online', 'pending');


-- ============================================================================
-- 3. SPECIALIZATIONS
-- ============================================================================

INSERT INTO `specializations` (`specialization_id`, `specialization_name`, `description`) VALUES
(1, 'Anxiety Disorders', 'Generalized anxiety, panic attacks, and social anxiety management.'),
(2, 'Depression', 'Major depressive disorder, persistent low mood, and emotional fatigue.'),
(3, 'Stress & Burnout', 'Workplace pressure, academic stress, and coping mechanisms.'),
(4, 'Trauma & PTSD', 'Recovery support for past emotional or psychological trauma.'),
(5, 'Sleep Disorders', 'Insomnia and stress-related sleep disturbances.');


-- ============================================================================
-- 4. THERAPIST SPECIALIZATIONS
-- ============================================================================

INSERT INTO `therapist_specializations` (`therapist_id`, `specialization_id`) VALUES
(1, 1),
(1, 3),
(2, 2),
(2, 5),
(3, 1),
(3, 4);


-- ============================================================================
-- 5. QUESTIONNAIRES
-- ============================================================================

INSERT INTO `questionnaires` (`questionnaire_id`, `title`, `description`, `version`, `is_active`) VALUES
(1, 'PHQ-9 Depression Screening', 'Standard 9-item questionnaire to screen for the presence and severity of depression.', '1.0', 1),
(2, 'GAD-7 Anxiety Assessment', '7-item self-report scale used to measure generalized anxiety symptoms.', '1.0', 1);


-- ============================================================================
-- 6. QUESTIONS
-- ============================================================================

INSERT INTO `questions` (`question_id`, `questionnaire_id`, `question_text`, `question_type`, `display_order`, `is_required`) VALUES
(1, 1, 'Little interest or pleasure in doing things over the last 2 weeks?', 'multiple_choice', 1, 1),
(2, 1, 'Feeling down, depressed, or hopeless?', 'multiple_choice', 2, 1),
(3, 1, 'Trouble falling or staying asleep, or sleeping too much?', 'multiple_choice', 3, 1),
(4, 1, 'Feeling tired or having little energy?', 'multiple_choice', 4, 1),
(5, 2, 'Feeling nervous, anxious, or on edge?', 'multiple_choice', 1, 1),
(6, 2, 'Not being able to stop or control worrying?', 'multiple_choice', 2, 1),
(7, 2, 'Trouble relaxing during daily activities?', 'scale', 3, 1);


-- ============================================================================
-- 7. MODEL VERSIONS
-- ============================================================================

INSERT INTO `model_versions` (`model_id`, `model_name`, `model_version`, `algorithm`, `accuracy`, `model_path`, `is_active`) VALUES
(1, 'MedGemma-MentalHealth', 'v1.0', 'Fine-Tuned Transformer LLM', 89.50, '/models/medgemma_mh_v1.bin', 0),
(2, 'MedGemma-MentalHealth', 'v2.1', 'Fine-Tuned Transformer LLM + Risk Classifier', 93.80, '/models/medgemma_mh_v2_1.bin', 1);


-- ============================================================================
-- 8. CHAT SESSIONS
-- ============================================================================

INSERT INTO `chat_sessions` (`chat_session_id`, `user_id`, `session_title`, `started_at`, `ended_at`, `status`) VALUES
(1, 1, 'Dealing with exam stress and sleep issues', '2026-11-10 10:00:00', '2026-11-10 10:25:00', 'closed'),
(2, 2, 'Feeling overwhelmed at work lately', '2026-11-14 18:30:00', NULL, 'active');


-- ============================================================================
-- 9. CHAT MESSAGES
-- ============================================================================

INSERT INTO `chat_messages` (`message_id`, `chat_session_id`, `sender`, `message_text`, `sent_at`) VALUES
(1, 1, 'user', 'Hi, I have been struggling to sleep before my final exams.', '2026-11-10 10:00:15'),
(2, 1, 'assistant', 'I hear you. Exam pressure can make it very hard to unwind. How many hours of sleep are you getting right now?', '2026-11-10 10:00:22'),
(3, 1, 'user', 'Barely 4 hours a night for the past week.', '2026-11-10 10:01:10'),
(4, 1, 'assistant', 'That sounds exhausting. Would you like to try a quick breathing exercise or take a short stress screening?', '2026-11-10 10:01:18'),
(5, 2, 'user', 'I feel constantly anxious about meeting deadlines.', '2026-11-14 18:30:10'),
(6, 2, 'assistant', 'Thank you for sharing that. Let us break down what is feeling most urgent today.', '2026-11-14 18:30:18');


-- ============================================================================
-- 10. ASSESSMENT SESSIONS
-- ============================================================================

INSERT INTO `assessment_sessions` (`assessment_id`, `user_id`, `questionnaire_id`, `started_at`, `completed_at`, `status`) VALUES
(1, 1, 1, '2026-11-10 10:30:00', '2026-11-10 10:35:00', 'completed'),
(2, 2, 2, '2026-11-14 19:00:00', '2026-11-14 19:04:00', 'completed'),
(3, 3, 1, '2026-11-15 14:15:00', NULL, 'abandoned');


-- ============================================================================
-- 11. ASSESSMENT RESULTS
-- ============================================================================

INSERT INTO `assessment_results` (`result_id`, `assessment_id`, `model_id`, `predicted_category`, `prediction_score`, `risk_level`, `medgemma_explanation`) VALUES
(1, 1, 2, 'Moderate Depression & Fatigue', 0.785, 'moderate', 'User reported frequent sleep disruption and low energy over two weeks. Recommend guided sleep hygiene and follow-up check-in.'),
(2, 2, 2, 'Severe Generalized Anxiety', 0.912, 'high', 'High frequency of uncontrollable worry and restlessness detected. Immediate consultation with a verified therapist is advised.');


-- ============================================================================
-- 12. ASSESSMENT RESPONSES
-- ============================================================================

INSERT INTO `assessment_responses` (`response_id`, `assessment_id`, `question_id`, `answer_text`, `answer_score`) VALUES
(1, 1, 1, 'Several days', 1.00),
(2, 1, 2, 'More than half the days', 2.00),
(3, 1, 3, 'Nearly every day', 3.00),
(4, 1, 4, 'More than half the days', 2.00),
(5, 2, 5, 'Nearly every day', 3.00),
(6, 2, 6, 'Nearly every day', 3.00),
(7, 2, 7, 'High difficulty relaxing (8/10)', 3.00);