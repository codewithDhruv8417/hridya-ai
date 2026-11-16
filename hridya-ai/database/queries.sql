-- ============================================================================
-- MENTAL HEALTH DATABASE
-- COMPLETE APPLICATION & ANALYTICAL QUERIES (queries.sql)
-- ============================================================================

USE mental_health_db;


-- ============================================================================
-- 1. USER & ACCOUNT MANAGEMENT
-- ============================================================================

-- Q1: Retrieve all active users ordered by registration date
SELECT 
    user_id, 
    full_name, 
    email, 
    role, 
    preferred_language, 
    created_at
FROM users
WHERE account_status = 'active'
ORDER BY created_at DESC;

-- Q2: Count total accounts grouped by user role (user, therapist, admin)
SELECT 
    role, 
    COUNT(*) AS total_accounts
FROM users
GROUP BY role;


-- ============================================================================
-- 2. THERAPIST DIRECTORY & SPECIALIZATIONS
-- ============================================================================

-- Q3: List all verified and active therapists with their qualifications and fees
SELECT 
    u.full_name AS therapist_name,
    u.email,
    u.phone,
    tp.qualification,
    tp.license_number,
    tp.experience_years,
    tp.consultation_fee,
    tp.session_mode
FROM therapist_profiles tp
JOIN users u ON tp.user_id = u.user_id
WHERE tp.verification_status = 'verified'
  AND u.account_status = 'active'
ORDER BY tp.experience_years DESC;

-- Q4: Display each verified therapist alongside their combined specializations
SELECT 
    u.full_name AS therapist_name,
    tp.session_mode,
    tp.consultation_fee,
    GROUP_CONCAT(s.specialization_name SEPARATOR ', ') AS specializations
FROM therapist_profiles tp
JOIN users u ON tp.user_id = u.user_id
JOIN therapist_specializations ts ON tp.therapist_id = ts.therapist_id
JOIN specializations s ON ts.specialization_id = s.specialization_id
WHERE tp.verification_status = 'verified'
GROUP BY tp.therapist_id, u.full_name, tp.session_mode, tp.consultation_fee;

-- Q5: Fetch all therapists awaiting admin verification (pending status)
SELECT 
    tp.therapist_id,
    u.full_name,
    u.email,
    tp.qualification,
    tp.license_number,
    tp.created_at AS applied_on
FROM therapist_profiles tp
JOIN users u ON tp.user_id = u.user_id
WHERE tp.verification_status = 'pending'
ORDER BY tp.created_at ASC;


-- ============================================================================
-- 3. QUESTIONNAIRES & ASSESSMENT SESSIONS
-- ============================================================================

-- Q6: Retrieve all questions for active questionnaires in display order
SELECT 
    q.title AS questionnaire_title,
    qs.display_order,
    qs.question_text,
    qs.question_type,
    qs.is_required
FROM questions qs
JOIN questionnaires q ON qs.questionnaire_id = q.questionnaire_id
WHERE q.is_active = 1
ORDER BY q.questionnaire_id, qs.display_order ASC;

-- Q7: Summarize assessment sessions by completion status
SELECT 
    status, 
    COUNT(*) AS total_sessions
FROM assessment_sessions
GROUP BY status;


-- ============================================================================
-- 4. ASSESSMENT RESULTS & HIGH-RISK ALERTS (MEDGEMMA AI)
-- ============================================================================

-- Q8: Identify high-risk users along with their AI prediction scores and explanations
SELECT 
    u.user_id,
    u.full_name,
    u.phone,
    u.email,
    q.title AS assessment_name,
    ar.predicted_category,
    ar.prediction_score,
    ar.risk_level,
    ar.medgemma_explanation,
    ar.predicted_at
FROM assessment_results ar
JOIN assessment_sessions s ON ar.assessment_id = s.assessment_id
JOIN users u ON s.user_id = u.user_id
JOIN questionnaires q ON s.questionnaire_id = q.questionnaire_id
WHERE ar.risk_level = 'high'
ORDER BY ar.predicted_at DESC;

-- Q9: Fetch all questions, user answers, and scores for a specific assessment session
SELECT 
    s.assessment_id,
    u.full_name AS user_name,
    qs.display_order,
    qs.question_text,
    resp.answer_text,
    resp.answer_score
FROM assessment_responses resp
JOIN assessment_sessions s ON resp.assessment_id = s.assessment_id
JOIN users u ON s.user_id = u.user_id
JOIN questions qs ON resp.question_id = qs.question_id
WHERE s.assessment_id = 1
ORDER BY qs.display_order ASC;

-- Q10: Aggregate total assessment results grouped by risk level
SELECT 
    risk_level, 
    COUNT(*) AS total_cases
FROM assessment_results
GROUP BY risk_level
ORDER BY total_cases DESC;


-- ============================================================================
-- 5. AI MODEL PERFORMANCE TRACKING
-- ============================================================================

-- Q11: Evaluate usage count and average prediction score per AI model version
SELECT 
    mv.model_name,
    mv.model_version,
    mv.algorithm,
    mv.accuracy AS base_accuracy,
    mv.is_active,
    COUNT(ar.result_id) AS total_predictions_made,
    ROUND(AVG(ar.prediction_score), 3) AS avg_prediction_score
FROM model_versions mv
LEFT JOIN assessment_results ar ON mv.model_id = ar.model_id
GROUP BY mv.model_id, mv.model_name, mv.model_version, mv.algorithm, mv.accuracy, mv.is_active;


-- ============================================================================
-- 6. AI CHATBOT SESSIONS & MESSAGES
-- ============================================================================

-- Q12: Calculate total chat sessions and message volume per user
SELECT 
    u.user_id,
    u.full_name,
    COUNT(DISTINCT cs.chat_session_id) AS total_chat_sessions,
    COUNT(cm.message_id) AS total_messages
FROM users u
JOIN chat_sessions cs ON u.user_id = cs.user_id
LEFT JOIN chat_messages cm ON cs.chat_session_id = cm.chat_session_id
GROUP BY u.user_id, u.full_name
ORDER BY total_messages DESC;

-- Q13: Retrieve the full chronological message history for a specific chat session
SELECT 
    cs.session_title,
    cm.sender,
    cm.message_text,
    cm.sent_at
FROM chat_messages cm
JOIN chat_sessions cs ON cm.chat_session_id = cs.chat_session_id
WHERE cs.chat_session_id = 1
ORDER BY cm.sent_at ASC;