// Application metrics tracking
let applicationSubmissionCount = 0;
let applicationErrors = 0;
let lastApplicationSubmission = null;

const incrementApplicationSubmission = () => {
  applicationSubmissionCount++;
  lastApplicationSubmission = new Date().toISOString();
  console.log(`=== METRICS: Application submission count: ${applicationSubmissionCount} ===`);
};

const incrementApplicationError = () => {
  applicationErrors++;
  console.log(`=== METRICS: Application error count: ${applicationErrors} ===`);
};

const getMetrics = () => {
  return {
    totalSubmissions: applicationSubmissionCount,
    totalErrors: applicationErrors,
    errorRate: applicationSubmissionCount > 0 ? 
      Math.round((applicationErrors / applicationSubmissionCount) * 100 * 100) / 100 : 0,
    lastSubmission: lastApplicationSubmission
  };
};

const resetMetrics = () => {
  applicationSubmissionCount = 0;
  applicationErrors = 0;
  lastApplicationSubmission = null;
  console.log('=== METRICS: Metrics reset ===');
};

module.exports = {
  incrementApplicationSubmission,
  incrementApplicationError,
  getMetrics,
  resetMetrics
};