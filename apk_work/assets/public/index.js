const REMINDER_KEY = 'quranify_reminder_set';
const REMINDER_TIME_KEY = 'quranify_reminder_time';
const TIMEZONE_KEY = 'quranify_timezone';

document.addEventListener('DOMContentLoaded', () => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  localStorage.setItem(TIMEZONE_KEY, userTimezone);

  // Setup notification listeners to open app when tapped
  setupNotificationListeners();

  // Initialize reminder settings display
  const reminderSet = localStorage.getItem(REMINDER_KEY) === 'true';
  const savedTime = localStorage.getItem(REMINDER_TIME_KEY) || '08:00';
  const reminderDesc = document.getElementById('reminderDesc');
  const reminderToggle = document.getElementById('reminderToggle');
  const reminderTimeRow = document.getElementById('reminderTimeRow');
  const settingsTimePicker = document.getElementById('settingsTimePicker');

  if (reminderDesc) {
    reminderDesc.textContent = reminderSet ? `Set for ${savedTime}` : 'Not set';
  }

  if (reminderToggle) {
    if (reminderSet) {
      reminderToggle.classList.add('on');
    } else {
      reminderToggle.classList.remove('on');
    }
  }

  if (reminderTimeRow) {
    reminderTimeRow.style.display = reminderSet ? 'flex' : 'none';
  }

  if (settingsTimePicker) {
    settingsTimePicker.value = savedTime;
  }
});

// Called from onboarding step 3
async function obSetReminderTime() {
  const timePicker = document.getElementById('obTimePicker');
  if (!timePicker || !timePicker.value) return;

  const time = timePicker.value;
  const timezone = localStorage.getItem(TIMEZONE_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone;

  await scheduleDailyReminder(time, timezone);

  localStorage.setItem(REMINDER_KEY, 'true');
  localStorage.setItem(REMINDER_TIME_KEY, time);

  // Update settings display
  const reminderDesc = document.getElementById('reminderDesc');
  const reminderToggle = document.getElementById('reminderToggle');
  const reminderTimeRow = document.getElementById('reminderTimeRow');

  if (reminderDesc) reminderDesc.textContent = `Set for ${time}`;
  if (reminderToggle) reminderToggle.classList.add('on');
  if (reminderTimeRow) reminderTimeRow.style.display = 'flex';

  // Move to step 4
  obNext(4);
}

// Skip reminder setup
function obSkipReminder() {
  localStorage.setItem(REMINDER_KEY, 'false');
  obNext(4);
}

// Toggle reminder from settings
async function toggleReminder() {
  const reminderSet = localStorage.getItem(REMINDER_KEY) === 'true';
  const reminderToggle = document.getElementById('reminderToggle');
  const reminderTimeRow = document.getElementById('reminderTimeRow');
  const reminderDesc = document.getElementById('reminderDesc');
  const savedTime = localStorage.getItem(REMINDER_TIME_KEY) || '08:00';

  if (reminderSet) {
    // Disable reminder
    await cancelDailyReminder();
    localStorage.setItem(REMINDER_KEY, 'false');
    if (reminderToggle) reminderToggle.classList.remove('on');
    if (reminderTimeRow) reminderTimeRow.style.display = 'none';
    if (reminderDesc) reminderDesc.textContent = 'Not set';
  } else {
    // Enable reminder
    const timezone = localStorage.getItem(TIMEZONE_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone;
    await scheduleDailyReminder(savedTime, timezone);
    localStorage.setItem(REMINDER_KEY, 'true');
    if (reminderToggle) reminderToggle.classList.add('on');
    if (reminderTimeRow) reminderTimeRow.style.display = 'flex';
    if (reminderDesc) reminderDesc.textContent = `Set for ${savedTime}`;
  }
}

// Change reminder time from settings
async function changeReminderTime() {
  const settingsTimePicker = document.getElementById('settingsTimePicker');
  if (!settingsTimePicker || !settingsTimePicker.value) return;

  const time = settingsTimePicker.value;
  const timezone = localStorage.getItem(TIMEZONE_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone;

  await scheduleDailyReminder(time, timezone);
  localStorage.setItem(REMINDER_TIME_KEY, time);

  const reminderDesc = document.getElementById('reminderDesc');
  if (reminderDesc) reminderDesc.textContent = `Set for ${time}`;
}

async function scheduleDailyReminder(time, timezone) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // Request permissions first
    const permissionResult = await LocalNotifications.requestPermissions();
    if (permissionResult.display !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    // Cancel existing notifications first
    await cancelDailyReminder();

    const [hours, minutes] = time.split(':').map(Number);

    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'NurAl - Daily Reminder',
          body: 'Time to read today\'s Quran verse. Tap to open.',
          id: 1001,
          schedule: {
            on: {
              hour: hours,
              minute: minutes
            },
            repeats: true
          },
          sound: 'default',
          actionTypeId: '',
          extra: {
            timezone: timezone,
            type: 'daily-reminder'
          }
        }
      ]
    });

    console.log(`Daily reminder set for ${time} in ${timezone}`);
    showToast(`Daily reminder set for ${time}`);
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    showToast('Error setting reminder');
  }
}

async function cancelDailyReminder() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({
      notifications: [{ id: 1001 }]
    });
  } catch (error) {
    console.error('Error canceling reminder:', error);
  }
}

// Toast notification helper
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Setup notification listeners to open app when tapped
async function setupNotificationListeners() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    // Open app to lock screen when notification is tapped
    LocalNotifications.addListener('localNotificationActionPerformed', () => {
      goTo('lockScreen');
    });
  } catch (error) {
    console.error('Error setting up notification listeners:', error);
  }
}
