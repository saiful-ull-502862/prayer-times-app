/**
 * Namaz Prayer Reminder Application
 * Calculates accurate prayer times based on location and provides notifications
 */

// ==================== Configuration ====================
const CONFIG = {
    DEFAULT_LATITUDE: 30.2241,  // Lafayette, LA
    DEFAULT_LONGITUDE: -92.0198,
    DEFAULT_TIMEZONE: 'America/Chicago',
    STORAGE_KEY: 'namazReminderSettings',
    NOTIFICATION_CHECK_INTERVAL: 60000, // 1 minute
    COUNTDOWN_UPDATE_INTERVAL: 1000, // 1 second
};

// ==================== Prayer Time Calculator ====================
class PrayerTimeCalculator {
    constructor() {
        // Calculation method parameters
        this.methods = {
            'ISNA': { fajrAngle: 15, ishaAngle: 15, name: 'Islamic Society of North America' },
            'MWL': { fajrAngle: 18, ishaAngle: 17, name: 'Muslim World League' },
            'Egyptian': { fajrAngle: 19.5, ishaAngle: 17.5, name: 'Egyptian General Authority' },
            'Makkah': { fajrAngle: 18.5, ishaAngle: 90, ishaMinutes: 90, name: 'Umm Al-Qura, Makkah' },
            'Karachi': { fajrAngle: 18, ishaAngle: 18, name: 'University of Islamic Sciences, Karachi' },
            'Tehran': { fajrAngle: 17.7, ishaAngle: 14, maghribAngle: 4.5, name: 'Institute of Geophysics, Tehran' },
        };

        // Default settings
        this.settings = {
            method: 'ISNA',
            asrMethod: 'Standard', // Standard (Shafi) or Hanafi
            midnightMethod: 'Standard',
            adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
        };
    }

    // Convert degrees to radians
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Convert radians to degrees
    toDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    // Calculate Julian Day
    getJulianDay(year, month, day) {
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        const A = Math.floor(year / 100);
        const B = 2 - A + Math.floor(A / 4);
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
    }

    // Calculate Sun's position
    getSunPosition(julianDay) {
        const D = julianDay - 2451545.0;
        const g = this.fixAngle(357.529 + 0.98560028 * D);
        const q = this.fixAngle(280.459 + 0.98564736 * D);
        const L = this.fixAngle(q + 1.915 * Math.sin(this.toRadians(g)) + 0.020 * Math.sin(this.toRadians(2 * g)));
        const e = 23.439 - 0.00000036 * D;
        const RA = this.toDegrees(Math.atan2(Math.cos(this.toRadians(e)) * Math.sin(this.toRadians(L)), Math.cos(this.toRadians(L)))) / 15;
        const d = this.toDegrees(Math.asin(Math.sin(this.toRadians(e)) * Math.sin(this.toRadians(L))));
        const EqT = q / 15 - this.fixHour(RA);
        return { declination: d, equation: EqT };
    }

    // Fix angle to be within 0-360
    fixAngle(angle) {
        return angle - 360 * Math.floor(angle / 360);
    }

    // Fix hour to be within 0-24
    fixHour(hour) {
        return hour - 24 * Math.floor(hour / 24);
    }

    // Calculate prayer time for a given angle
    getTimeForAngle(angle, latitude, declination, direction) {
        const latRad = this.toRadians(latitude);
        const decRad = this.toRadians(declination);
        const angleRad = this.toRadians(angle);

        const cosValue = (-Math.sin(angleRad) - Math.sin(latRad) * Math.sin(decRad)) /
                         (Math.cos(latRad) * Math.cos(decRad));

        if (cosValue < -1 || cosValue > 1) {
            return null; // No valid time (polar regions)
        }

        const hourAngle = this.toDegrees(Math.acos(cosValue)) / 15;
        return direction === 'ccw' ? hourAngle : -hourAngle;
    }

    // Calculate Asr time
    getAsrTime(latitude, declination, factor) {
        const latRad = this.toRadians(latitude);
        const decRad = this.toRadians(declination);
        const angle = -this.toDegrees(Math.atan(1 / (factor + Math.tan(Math.abs(latRad - decRad)))));
        return this.getTimeForAngle(angle, latitude, declination, 'ccw');
    }

    // Calculate prayer times for a given date and location
    calculate(date, latitude, longitude, timezone) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        const julianDay = this.getJulianDay(year, month, day);
        const sunPos = this.getSunPosition(julianDay);

        const method = this.methods[this.settings.method];
        const asrFactor = this.settings.asrMethod === 'Hanafi' ? 2 : 1;

        // Calculate base times (in hours from midnight)
        const transit = 12 + timezone - longitude / 15 - sunPos.equation;

        const fajrAngle = this.getTimeForAngle(method.fajrAngle, latitude, sunPos.declination, 'cw');
        const sunriseAngle = this.getTimeForAngle(0.833, latitude, sunPos.declination, 'cw');
        const asrAngle = this.getAsrTime(latitude, sunPos.declination, asrFactor);
        const sunsetAngle = this.getTimeForAngle(0.833, latitude, sunPos.declination, 'ccw');

        let ishaAngle;
        if (method.ishaMinutes) {
            ishaAngle = method.ishaMinutes / 60;
        } else {
            ishaAngle = this.getTimeForAngle(method.ishaAngle, latitude, sunPos.declination, 'ccw');
        }

        // Calculate actual times
        const times = {
            fajr: transit - fajrAngle,
            sunrise: transit - sunriseAngle,
            dhuhr: transit,
            asr: transit + asrAngle,
            maghrib: transit + sunsetAngle,
            isha: method.ishaMinutes ? transit + sunsetAngle + ishaAngle : transit + ishaAngle
        };

        // Apply adjustments
        for (const prayer in times) {
            if (times[prayer] !== null) {
                times[prayer] += (this.settings.adjustments[prayer] || 0) / 60;
                times[prayer] = this.fixHour(times[prayer]);
            }
        }

        return times;
    }

    // Format time as HH:MM
    formatTime(hours, format24 = false) {
        if (hours === null) return '--:--';

        const totalMinutes = Math.round(hours * 60);
        let h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;

        if (format24) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }

        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m.toString().padStart(2, '0')} ${period}`;
    }

    // Get time as Date object
    getTimeAsDate(hours, baseDate) {
        const date = new Date(baseDate);
        const totalMinutes = Math.round(hours * 60);
        date.setHours(Math.floor(totalMinutes / 60) % 24);
        date.setMinutes(totalMinutes % 60);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }
}

// ==================== Hijri Date Calculator ====================
class HijriDateCalculator {
    static toHijri(gregorianDate) {
        const jd = Math.floor((gregorianDate.getTime() / 86400000) + 2440588);
        const l = jd - 1948440 + 10632;
        const n = Math.floor((l - 1) / 10631);
        const l2 = l - 10631 * n + 354;
        const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
                  Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
        const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
                   Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
        const month = Math.floor((24 * l3) / 709);
        const day = l3 - Math.floor((709 * month) / 24);
        const year = 30 * n + j - 30;

        const months = [
            'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
            'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
            'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
        ];

        return {
            day: day,
            month: month,
            year: year,
            monthName: months[month - 1]
        };
    }

    static format(date) {
        const hijri = this.toHijri(date);
        return `${hijri.day} ${hijri.monthName} ${hijri.year} AH`;
    }
}

// ==================== Main Application ====================
class NamazReminderApp {
    constructor() {
        this.calculator = new PrayerTimeCalculator();
        this.latitude = CONFIG.DEFAULT_LATITUDE;
        this.longitude = CONFIG.DEFAULT_LONGITUDE;
        this.locationName = 'Lafayette, LA';
        this.prayerTimes = {};
        this.notificationTimers = [];
        this.emailTimers = [];
        this.countdownInterval = null;
        this.is24Hour = false;
        this.emailjsInitialized = false;

        this.init();
    }

    async init() {
        this.loadSettings();
        this.initEmailJS();
        this.setupEventListeners();
        await this.detectLocation();
        this.updatePrayerTimes();
        this.updateUI();
        this.startCountdown();
        this.scheduleNotifications();
        this.scheduleEmailReminders();
        this.generateWeeklySchedule();
        this.checkNotificationPermission();
    }

    // Initialize EmailJS
    initEmailJS() {
        const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
        if (settings.emailjsPublicKey && typeof emailjs !== 'undefined') {
            try {
                emailjs.init(settings.emailjsPublicKey);
                this.emailjsInitialized = true;
                console.log('EmailJS initialized successfully');
            } catch (error) {
                console.warn('EmailJS initialization failed:', error);
                this.emailjsInitialized = false;
            }
        }
    }

    // Load settings from localStorage
    loadSettings() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (saved) {
                const settings = JSON.parse(saved);
                this.latitude = settings.latitude || CONFIG.DEFAULT_LATITUDE;
                this.longitude = settings.longitude || CONFIG.DEFAULT_LONGITUDE;
                this.locationName = settings.locationName || 'Unknown Location';
                this.calculator.settings.method = settings.calculationMethod || 'ISNA';
                this.calculator.settings.asrMethod = settings.asrMethod || 'Standard';
                this.calculator.settings.midnightMethod = settings.midnightMethod || 'Standard';
                this.calculator.settings.adjustments = settings.adjustments || {};
                this.is24Hour = settings.is24Hour || false;

                // Apply UI settings
                if (settings.darkMode) {
                    document.body.classList.add('dark-mode');
                }

                // Restore form values
                this.restoreFormValues(settings);
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }

    // Save settings to localStorage
    saveSettings() {
        const settings = {
            latitude: this.latitude,
            longitude: this.longitude,
            locationName: this.locationName,
            calculationMethod: this.calculator.settings.method,
            asrMethod: this.calculator.settings.asrMethod,
            midnightMethod: this.calculator.settings.midnightMethod,
            adjustments: this.calculator.settings.adjustments,
            is24Hour: this.is24Hour,
            darkMode: document.body.classList.contains('dark-mode'),
            emailAddress: document.getElementById('emailAddress')?.value || '',
            emailReminders: document.getElementById('emailReminders')?.checked || false,
            emailjsPublicKey: document.getElementById('emailjsPublicKey')?.value || '',
            emailjsServiceId: document.getElementById('emailjsServiceId')?.value || '',
            emailjsTemplateId: document.getElementById('emailjsTemplateId')?.value || '',
            browserNotifications: document.getElementById('browserNotifications')?.checked || true,
            notificationTime: document.getElementById('notificationTime')?.value || '15',
            playAdhan: document.getElementById('playAdhan')?.checked || false,
            notifyPrayers: {
                fajr: document.getElementById('notifyFajr')?.checked || true,
                dhuhr: document.getElementById('notifyDhuhr')?.checked || true,
                asr: document.getElementById('notifyAsr')?.checked || true,
                maghrib: document.getElementById('notifyMaghrib')?.checked || true,
                isha: document.getElementById('notifyIsha')?.checked || true
            }
        };

        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(settings));

        // Reinitialize EmailJS if credentials changed
        if (settings.emailjsPublicKey) {
            this.initEmailJS();
        }

        // Reschedule email reminders
        this.scheduleEmailReminders();

        this.showToast('Settings saved successfully', 'success');
    }

    // Restore form values from settings
    restoreFormValues(settings) {
        const setSelectValue = (id, value) => {
            const el = document.getElementById(id);
            if (el && value) el.value = value;
        };

        const setCheckbox = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.checked = value;
        };

        const setInput = (id, value) => {
            const el = document.getElementById(id);
            if (el && value !== undefined) el.value = value;
        };

        setSelectValue('calculationMethod', settings.calculationMethod);
        setSelectValue('asrMethod', settings.asrMethod);
        setSelectValue('midnightMethod', settings.midnightMethod);
        setSelectValue('timeFormat', settings.is24Hour ? '24' : '12');
        setSelectValue('notificationTime', settings.notificationTime);

        setCheckbox('darkMode', settings.darkMode);
        setCheckbox('emailReminders', settings.emailReminders);
        setCheckbox('browserNotifications', settings.browserNotifications !== false);
        setCheckbox('playAdhan', settings.playAdhan);

        if (settings.notifyPrayers) {
            setCheckbox('notifyFajr', settings.notifyPrayers.fajr !== false);
            setCheckbox('notifyDhuhr', settings.notifyPrayers.dhuhr !== false);
            setCheckbox('notifyAsr', settings.notifyPrayers.asr !== false);
            setCheckbox('notifyMaghrib', settings.notifyPrayers.maghrib !== false);
            setCheckbox('notifyIsha', settings.notifyPrayers.isha !== false);
        }

        setInput('emailAddress', settings.emailAddress);
        setInput('emailjsPublicKey', settings.emailjsPublicKey);
        setInput('emailjsServiceId', settings.emailjsServiceId);
        setInput('emailjsTemplateId', settings.emailjsTemplateId);

        if (settings.adjustments) {
            setInput('adjustFajr', settings.adjustments.fajr || 0);
            setInput('adjustDhuhr', settings.adjustments.dhuhr || 0);
            setInput('adjustAsr', settings.adjustments.asr || 0);
            setInput('adjustMaghrib', settings.adjustments.maghrib || 0);
            setInput('adjustIsha', settings.adjustments.isha || 0);
        }
    }

    // Detect user location
    async detectLocation() {
        const locationMethod = document.getElementById('locationMethod')?.value || 'auto';

        if (locationMethod === 'auto') {
            if ('geolocation' in navigator) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 300000
                        });
                    });

                    this.latitude = position.coords.latitude;
                    this.longitude = position.coords.longitude;
                    await this.reverseGeocode(this.latitude, this.longitude);
                } catch (error) {
                    console.warn('Geolocation failed:', error);
                    this.showToast('Could not detect location. Using default (Lafayette, LA)', 'warning');
                }
            }
        }

        this.updateLocationDisplay();
    }

    // Reverse geocode coordinates to get city name
    async reverseGeocode(lat, lon) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
            );
            const data = await response.json();

            if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.county;
                const state = data.address.state;
                this.locationName = city && state ? `${city}, ${state}` : (city || state || 'Unknown Location');
            }
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            this.locationName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
    }

    // Update location display
    updateLocationDisplay() {
        const locationDisplay = document.getElementById('locationDisplay');
        if (locationDisplay) {
            locationDisplay.textContent = this.locationName;
        }
    }

    // Calculate prayer times for today
    updatePrayerTimes() {
        const today = new Date();
        const timezoneOffset = -today.getTimezoneOffset() / 60;

        this.prayerTimes = this.calculator.calculate(
            today,
            this.latitude,
            this.longitude,
            timezoneOffset
        );
    }

    // Update the UI with prayer times
    updateUI() {
        // Update dates
        const today = new Date();
        document.getElementById('gregorianDate').textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('hijriDate').textContent = HijriDateCalculator.format(today);

        // Update prayer times
        const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const now = new Date();
        let currentPrayer = null;
        let nextPrayer = null;
        let nextPrayerTime = null;

        prayers.forEach((prayer, index) => {
            const timeEl = document.getElementById(`${prayer}Time`);
            const card = document.querySelector(`.prayer-card[data-prayer="${prayer}"]`);

            if (timeEl && this.prayerTimes[prayer]) {
                timeEl.textContent = this.calculator.formatTime(this.prayerTimes[prayer], this.is24Hour);
            }

            // Determine current and next prayer
            if (this.prayerTimes[prayer]) {
                const prayerDate = this.calculator.getTimeAsDate(this.prayerTimes[prayer], now);

                if (card) {
                    card.classList.remove('active', 'passed');

                    if (prayerDate <= now) {
                        // Find if this is the current prayer
                        const nextIndex = prayers.findIndex((p, i) => {
                            if (i <= index) return false;
                            const nextTime = this.prayerTimes[p];
                            if (!nextTime) return false;
                            return this.calculator.getTimeAsDate(nextTime, now) > now;
                        });

                        if (nextIndex === -1 || nextIndex === index + 1) {
                            if (prayer !== 'sunrise') {
                                currentPrayer = prayer;
                                card.classList.add('active');
                            } else {
                                card.classList.add('passed');
                            }
                        } else {
                            card.classList.add('passed');
                        }
                    }
                }

                // Find next prayer
                if (prayerDate > now && !nextPrayer && prayer !== 'sunrise') {
                    nextPrayer = prayer;
                    nextPrayerTime = prayerDate;
                }
            }
        });

        // If no next prayer today, next is Fajr tomorrow
        if (!nextPrayer) {
            nextPrayer = 'fajr';
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowTimes = this.calculator.calculate(
                tomorrow,
                this.latitude,
                this.longitude,
                -now.getTimezoneOffset() / 60
            );
            nextPrayerTime = this.calculator.getTimeAsDate(tomorrowTimes.fajr, tomorrow);
        }

        // Update current and next prayer display
        const currentPrayerEl = document.getElementById('currentPrayer');
        const nextPrayerNameEl = document.getElementById('nextPrayerName');
        const nextPrayerTimeEl = document.getElementById('nextPrayerTime');

        if (currentPrayerEl) {
            currentPrayerEl.textContent = currentPrayer ?
                currentPrayer.charAt(0).toUpperCase() + currentPrayer.slice(1) :
                'Between Prayers';
        }

        if (nextPrayerNameEl) {
            nextPrayerNameEl.textContent = nextPrayer.charAt(0).toUpperCase() + nextPrayer.slice(1);
        }

        if (nextPrayerTimeEl && nextPrayerTime) {
            nextPrayerTimeEl.textContent = nextPrayerTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: !this.is24Hour
            });
        }

        // Store for countdown
        this.nextPrayerTime = nextPrayerTime;
        this.nextPrayer = nextPrayer;
    }

    // Start countdown timer
    startCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, CONFIG.COUNTDOWN_UPDATE_INTERVAL);

        this.updateCountdown();
    }

    // Update countdown display
    updateCountdown() {
        if (!this.nextPrayerTime) return;

        const now = new Date();
        let diff = this.nextPrayerTime - now;

        if (diff <= 0) {
            // Prayer time reached - refresh
            this.updatePrayerTimes();
            this.updateUI();
            this.scheduleNotifications();
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff %= (1000 * 60 * 60);
        const minutes = Math.floor(diff / (1000 * 60));
        diff %= (1000 * 60);
        const seconds = Math.floor(diff / 1000);

        document.getElementById('countdownHours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('countdownMinutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('countdownSeconds').textContent = seconds.toString().padStart(2, '0');
    }

    // Check notification permission
    checkNotificationPermission() {
        const banner = document.getElementById('notificationBanner');

        if (!('Notification' in window)) {
            if (banner) banner.style.display = 'none';
            return;
        }

        if (Notification.permission === 'granted') {
            if (banner) {
                banner.classList.add('granted');
                banner.classList.add('hidden');
            }
        } else if (Notification.permission === 'denied') {
            if (banner) banner.classList.add('hidden');
        }
    }

    // Request notification permission
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            this.showToast('Notifications not supported in this browser', 'error');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                this.showToast('Notifications enabled successfully!', 'success');
                this.checkNotificationPermission();
                this.scheduleNotifications();
                return true;
            } else {
                this.showToast('Notification permission denied', 'warning');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            this.showToast('Error enabling notifications', 'error');
            return false;
        }
    }

    // Schedule notifications for prayers
    scheduleNotifications() {
        // Clear existing timers
        this.notificationTimers.forEach(timer => clearTimeout(timer));
        this.notificationTimers = [];

        if (Notification.permission !== 'granted') return;

        const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
        if (settings.browserNotifications === false) return;

        const notifyMinutes = parseInt(settings.notificationTime || '15');
        const notifyPrayers = settings.notifyPrayers || {};
        const playAdhan = settings.playAdhan || false;

        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const now = new Date();

        prayers.forEach(prayer => {
            if (notifyPrayers[prayer] === false) return;
            if (!this.prayerTimes[prayer]) return;

            const prayerTime = this.calculator.getTimeAsDate(this.prayerTimes[prayer], now);
            const notifyTime = new Date(prayerTime.getTime() - notifyMinutes * 60 * 1000);

            if (notifyTime > now) {
                const delay = notifyTime - now;
                const timer = setTimeout(() => {
                    this.showNotification(prayer, prayerTime, playAdhan);
                }, delay);
                this.notificationTimers.push(timer);
            }

            // Also notify at exact prayer time
            if (prayerTime > now) {
                const delay = prayerTime - now;
                const timer = setTimeout(() => {
                    this.showNotification(prayer, prayerTime, playAdhan, true);
                }, delay);
                this.notificationTimers.push(timer);
            }
        });
    }

    // Show browser notification
    showNotification(prayer, prayerTime, playAdhan, isExactTime = false) {
        const prayerNames = {
            fajr: 'Fajr',
            dhuhr: 'Dhuhr',
            asr: 'Asr',
            maghrib: 'Maghrib',
            isha: 'Isha'
        };

        const title = isExactTime ?
            `Time for ${prayerNames[prayer]} Prayer` :
            `${prayerNames[prayer]} Prayer Coming Up`;

        const body = isExactTime ?
            `It's time to pray ${prayerNames[prayer]}. May Allah accept your prayers.` :
            `${prayerNames[prayer]} prayer will begin at ${prayerTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

        const notification = new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🕌</text></svg>',
            tag: `prayer-${prayer}-${isExactTime ? 'exact' : 'reminder'}`,
            requireInteraction: isExactTime
        });

        if (playAdhan && isExactTime) {
            const audio = document.getElementById('adhanAudio');
            if (audio) {
                audio.play().catch(e => console.log('Audio play failed:', e));
            }
        }

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }

    // Schedule email reminders for prayers
    scheduleEmailReminders() {
        // Clear existing email timers
        this.emailTimers.forEach(timer => clearTimeout(timer));
        this.emailTimers = [];

        const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '{}');

        // Check if email reminders are enabled and configured
        if (!settings.emailReminders) return;
        if (!settings.emailAddress) return;
        if (!settings.emailjsPublicKey || !settings.emailjsServiceId || !settings.emailjsTemplateId) {
            console.log('EmailJS not fully configured');
            return;
        }

        const notifyMinutes = parseInt(settings.notificationTime || '15');
        const notifyPrayers = settings.notifyPrayers || {};
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const now = new Date();

        prayers.forEach(prayer => {
            if (notifyPrayers[prayer] === false) return;
            if (!this.prayerTimes[prayer]) return;

            const prayerTime = this.calculator.getTimeAsDate(this.prayerTimes[prayer], now);
            const notifyTime = new Date(prayerTime.getTime() - notifyMinutes * 60 * 1000);

            if (notifyTime > now) {
                const delay = notifyTime - now;
                const timer = setTimeout(() => {
                    this.sendEmailReminder(prayer, prayerTime, settings);
                }, delay);
                this.emailTimers.push(timer);
            }
        });

        if (this.emailTimers.length > 0) {
            console.log(`Scheduled ${this.emailTimers.length} email reminders`);
        }
    }

    // Send email reminder via EmailJS
    async sendEmailReminder(prayer, prayerTime, settings) {
        if (!this.emailjsInitialized || typeof emailjs === 'undefined') {
            console.warn('EmailJS not initialized');
            return;
        }

        const prayerNames = {
            fajr: 'Fajr',
            dhuhr: 'Dhuhr',
            asr: 'Asr',
            maghrib: 'Maghrib',
            isha: 'Isha'
        };

        const templateParams = {
            to_email: settings.emailAddress,
            prayer_name: prayerNames[prayer],
            prayer_time: prayerTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            location: this.locationName,
            date: new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            hijri_date: HijriDateCalculator.format(new Date())
        };

        try {
            await emailjs.send(
                settings.emailjsServiceId,
                settings.emailjsTemplateId,
                templateParams
            );
            console.log(`Email reminder sent for ${prayerNames[prayer]}`);
            this.showToast(`Email reminder sent for ${prayerNames[prayer]}`, 'success');
        } catch (error) {
            console.error('Failed to send email reminder:', error);
            this.showToast('Failed to send email reminder', 'error');
        }
    }

    // Send test email
    async sendTestEmail() {
        const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '{}');

        if (!settings.emailAddress) {
            this.showToast('Please enter your email address first', 'warning');
            return;
        }

        if (!settings.emailjsPublicKey || !settings.emailjsServiceId || !settings.emailjsTemplateId) {
            this.showToast('Please configure EmailJS credentials first', 'warning');
            return;
        }

        if (!this.emailjsInitialized) {
            this.initEmailJS();
        }

        if (typeof emailjs === 'undefined') {
            this.showToast('EmailJS library not loaded', 'error');
            return;
        }

        const templateParams = {
            to_email: settings.emailAddress,
            prayer_name: 'Test Prayer',
            prayer_time: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            location: this.locationName,
            date: new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            hijri_date: HijriDateCalculator.format(new Date())
        };

        try {
            this.showToast('Sending test email...', 'info');
            await emailjs.send(
                settings.emailjsServiceId,
                settings.emailjsTemplateId,
                templateParams
            );
            this.showToast('Test email sent successfully! Check your inbox.', 'success');
        } catch (error) {
            console.error('Failed to send test email:', error);
            this.showToast(`Failed to send email: ${error.text || error.message || 'Unknown error'}`, 'error');
        }
    }

    // Generate weekly prayer schedule
    generateWeeklySchedule() {
        const tbody = document.getElementById('weeklyTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        const today = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const times = this.calculator.calculate(
                date,
                this.latitude,
                this.longitude,
                -today.getTimezoneOffset() / 60
            );

            const row = document.createElement('tr');
            if (i === 0) row.classList.add('today');

            const dayCell = document.createElement('td');
            dayCell.textContent = i === 0 ? 'Today' : (i === 1 ? 'Tomorrow' : dayNames[date.getDay()]);
            row.appendChild(dayCell);

            ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(prayer => {
                const cell = document.createElement('td');
                cell.textContent = this.calculator.formatTime(times[prayer], this.is24Hour);
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }

        // Enable notifications button
        const enableNotificationsBtn = document.getElementById('enableNotifications');
        if (enableNotificationsBtn) {
            enableNotificationsBtn.addEventListener('click', () => {
                this.requestNotificationPermission();
            });
        }

        // Refresh location button
        const refreshLocationBtn = document.getElementById('refreshLocation');
        if (refreshLocationBtn) {
            refreshLocationBtn.addEventListener('click', async () => {
                await this.detectLocation();
                this.updatePrayerTimes();
                this.updateUI();
                this.generateWeeklySchedule();
                this.scheduleNotifications();
            });
        }

        // Location method change
        const locationMethod = document.getElementById('locationMethod');
        if (locationMethod) {
            locationMethod.addEventListener('change', (e) => {
                const cityGroup = document.getElementById('citySelectGroup');
                const manualLatGroup = document.getElementById('manualLocationGroup');
                const manualLonGroup = document.getElementById('manualLongitudeGroup');

                cityGroup.style.display = e.target.value === 'city' ? 'block' : 'none';
                manualLatGroup.style.display = e.target.value === 'manual' ? 'block' : 'none';
                manualLonGroup.style.display = e.target.value === 'manual' ? 'block' : 'none';
            });
        }

        // City select change
        const citySelect = document.getElementById('citySelect');
        if (citySelect) {
            citySelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    const [lat, lon] = e.target.value.split(',').map(Number);
                    this.latitude = lat;
                    this.longitude = lon;
                    this.locationName = e.target.options[e.target.selectedIndex].text;
                    this.updateLocationDisplay();
                    this.updatePrayerTimes();
                    this.updateUI();
                    this.generateWeeklySchedule();
                    this.scheduleNotifications();
                    this.saveSettings();
                }
            });
        }

        // Update location button
        const updateLocationBtn = document.getElementById('updateLocation');
        if (updateLocationBtn) {
            updateLocationBtn.addEventListener('click', async () => {
                const method = document.getElementById('locationMethod')?.value;

                if (method === 'auto') {
                    await this.detectLocation();
                } else if (method === 'manual') {
                    const lat = parseFloat(document.getElementById('manualLatitude')?.value);
                    const lon = parseFloat(document.getElementById('manualLongitude')?.value);

                    if (!isNaN(lat) && !isNaN(lon)) {
                        this.latitude = lat;
                        this.longitude = lon;
                        await this.reverseGeocode(lat, lon);
                        this.updateLocationDisplay();
                    } else {
                        this.showToast('Please enter valid coordinates', 'error');
                        return;
                    }
                }

                this.updatePrayerTimes();
                this.updateUI();
                this.generateWeeklySchedule();
                this.scheduleNotifications();
                this.saveSettings();
            });
        }

        // Calculation method changes
        const calculationMethod = document.getElementById('calculationMethod');
        if (calculationMethod) {
            calculationMethod.addEventListener('change', (e) => {
                this.calculator.settings.method = e.target.value;
                this.updatePrayerTimes();
                this.updateUI();
                this.generateWeeklySchedule();
                this.scheduleNotifications();
                this.saveSettings();
            });
        }

        const asrMethod = document.getElementById('asrMethod');
        if (asrMethod) {
            asrMethod.addEventListener('change', (e) => {
                this.calculator.settings.asrMethod = e.target.value;
                this.updatePrayerTimes();
                this.updateUI();
                this.generateWeeklySchedule();
                this.scheduleNotifications();
                this.saveSettings();
            });
        }

        // Time format change
        const timeFormat = document.getElementById('timeFormat');
        if (timeFormat) {
            timeFormat.addEventListener('change', (e) => {
                this.is24Hour = e.target.value === '24';
                this.updateUI();
                this.generateWeeklySchedule();
                this.saveSettings();
            });
        }

        // Dark mode toggle
        const darkMode = document.getElementById('darkMode');
        if (darkMode) {
            darkMode.addEventListener('change', (e) => {
                document.body.classList.toggle('dark-mode', e.target.checked);
                this.saveSettings();
            });
        }

        // Notification settings changes
        ['browserNotifications', 'notificationTime', 'notifyFajr', 'notifyDhuhr',
         'notifyAsr', 'notifyMaghrib', 'notifyIsha', 'playAdhan'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    this.scheduleNotifications();
                    this.saveSettings();
                });
            }
        });

        // Save adjustments button
        const saveAdjustments = document.getElementById('saveAdjustments');
        if (saveAdjustments) {
            saveAdjustments.addEventListener('click', () => {
                this.calculator.settings.adjustments = {
                    fajr: parseInt(document.getElementById('adjustFajr')?.value) || 0,
                    dhuhr: parseInt(document.getElementById('adjustDhuhr')?.value) || 0,
                    asr: parseInt(document.getElementById('adjustAsr')?.value) || 0,
                    maghrib: parseInt(document.getElementById('adjustMaghrib')?.value) || 0,
                    isha: parseInt(document.getElementById('adjustIsha')?.value) || 0
                };
                this.updatePrayerTimes();
                this.updateUI();
                this.generateWeeklySchedule();
                this.scheduleNotifications();
                this.saveSettings();
            });
        }

        // Save email settings button
        const saveEmailSettings = document.getElementById('saveEmailSettings');
        if (saveEmailSettings) {
            saveEmailSettings.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Test email button
        const testEmailBtn = document.getElementById('testEmail');
        if (testEmailBtn) {
            testEmailBtn.addEventListener('click', () => {
                this.sendTestEmail();
            });
        }

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                // Close mobile menu if open
                document.querySelector('.nav-links')?.classList.remove('active');
            });
        });
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

        container.appendChild(toast);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
}

// ==================== Contact Form Handler ====================
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = document.getElementById('contactSubmitBtn');
        this.formStatus = document.getElementById('formStatus');

        if (this.form) {
            this.init();
        }
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Validate form
        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        this.hideStatus();

        try {
            const formData = new FormData(this.form);

            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus('success', 'JazakAllah Khair! Your message has been sent successfully. We will get back to you soon.');
                this.form.reset();

                // Show toast notification if available
                if (window.namazApp && window.namazApp.showToast) {
                    window.namazApp.showToast('Message sent successfully!', 'success');
                }
            } else {
                throw new Error(result.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            this.showStatus('error', 'Sorry, there was an error sending your message. Please try again or contact us directly.');

            if (window.namazApp && window.namazApp.showToast) {
                window.namazApp.showToast('Failed to send message', 'error');
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        if (this.submitBtn) {
            this.submitBtn.disabled = isLoading;
            this.submitBtn.classList.toggle('loading', isLoading);

            if (isLoading) {
                this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            } else {
                this.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
            }
        }
    }

    showStatus(type, message) {
        if (this.formStatus) {
            this.formStatus.className = `form-status show ${type}`;
            this.formStatus.innerHTML = `
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            `;
        }
    }

    hideStatus() {
        if (this.formStatus) {
            this.formStatus.className = 'form-status';
            this.formStatus.innerHTML = '';
        }
    }
}

// ==================== Initialize Application ====================
document.addEventListener('DOMContentLoaded', () => {
    window.namazApp = new NamazReminderApp();
    window.contactForm = new ContactFormHandler();
});

// Service Worker Registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed:', error));
    });
}
