// In your sendToAllUsers function, update the error handling:
const sendToAllUsers = async () => {
  if (!signups || signups.length === 0) {
    setResult({ error: 'No users found to email' });
    return;
  }

  if (!window.confirm(`Send this email to ALL ${signups.length} users?`)) return;
  
  setLoading(true);
  setResult(null);

  try {
    let emailResult;

    if (emailType === 'launch') {
      emailResult = await sendBulkEmails(signups, 'launch');
    } else if (emailType === 'custom') {
      if (!customSubject || !customMessage) {
        alert('Please enter both subject and message');
        setLoading(false);
        return;
      }
      emailResult = await sendBulkEmails(signups, 'custom', {
        subject: customSubject,
        message: customMessage
      });
    }

    setResult({
      success: true,
      message: `✅ Successfully sent ${emailResult.successful} emails!`,
      details: `Total users: ${emailResult.total} | Failed: ${emailResult.failed}`
    });

  } catch (error) {
    // Show specific error message about API key
    if (error.message.includes('API key not configured')) {
      setResult({
        success: false,
        error: 'Email service not configured. Please add RESEND_API_KEY to enable email sending.'
      });
    } else {
      setResult({
        success: false,
        error: error.message
      });
    }
  } finally {
    setLoading(false);
  }
};