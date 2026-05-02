// ═════════════════════════════════════════════════════
//  ONBOARDING REMINDER FLOW
// ═════════════════════════════════════════════════════
function showOnboardingStep(step) {
  document.querySelectorAll('.onboard-step').forEach(s => s.classList.remove('active'));
  document.getElementById('ob-step-' + step).classList.add('active');
}

function setReminderAndStart() {
  const timeInput = document.getElementById('reminderTime').value;
  if (timeInput) {
    state.reminderTime = timeInput;
    state.onboardingDone = true;
    saveState();
    if ('Notification' in window && Notification.permission === 'granted') {
      scheduleNotification(timeInput);
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') scheduleNotification(timeInput);
      });
    }
    showToast('Reminder set for ' + timeInput);
  }
  goTo('lockScreen');
}

function skipReminder() {
  state.onboardingDone = true;
  saveState();
  goTo('lockScreen');
}

function scheduleNotification(time) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  localStorage.setItem('quranify_reminder', time);
  showToast('Daily reminder set for ' + time);
}
