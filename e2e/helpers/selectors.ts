/** Centralized data-testid selectors for Playwright tests */

function tid(id: string) {
  return `[data-testid="${id}"]`;
}

// Landing page
export const HERO_TITLE = tid("hero-title");
export const HERO_CTA = tid("hero-cta");
export const NAV_SIGN_IN = tid("nav-sign-in");

// Dashboard
export const DASHBOARD_TITLE = tid("dashboard-title");
export const INTERVIEW_GRID = tid("interview-grid");
export const ADD_NEW_INTERVIEW = tid("add-new-interview");

// Create dialog
export const MODE_AUTO = tid("mode-auto");
export const START_INTERVIEW_BUTTON = tid("start-interview-button");

// Interview card
export const INTERVIEW_CARD = tid("interview-card");
export const CARD_JOB_POSITION = tid("card-job-position");
export const CARD_FEEDBACK_LINK = tid("card-feedback-link");
export const CARD_START_LINK = tid("card-start-link");

// Interview setup page
export const SETUP_POSITION = tid("setup-position");

// Interview start page
export const QUESTION_TEXT = tid("question-text");
export const ANSWER_TEXTAREA = tid("answer-textarea");
export const SUBMIT_ANSWER_BUTTON = tid("submit-answer-button");
export const RECORD_BUTTON = tid("record-button");

// Feedback page
export const OVERALL_RATING = tid("overall-rating");
export const FEEDBACK_QUESTION = tid("feedback-question");
export const BACK_TO_DASHBOARD = tid("back-to-dashboard");
