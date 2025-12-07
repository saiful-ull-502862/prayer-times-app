# Namaz Prayer Reminder App

A comprehensive Namaz (Salah) prayer time reminder application for Muslims in the United States. Get accurate prayer times based on your location with browser notifications and customizable settings.

**Live Demo**: [Open Namaz Reminder](https://saiful-ull-502862.github.io/prayer-times-app/)

## Features

### Prayer Time Calculation
- **Accurate Calculations**: Uses precise astronomical algorithms to calculate prayer times
- **Multiple Calculation Methods**: Supports ISNA, MWL, Egyptian, Makkah, Karachi, and Tehran methods
- **Asr Calculation Options**: Standard (Shafi'i) or Hanafi method
- **Time Adjustments**: Fine-tune individual prayer times as needed

### Location Support
- **Auto-Detection**: Automatically detects your location using GPS
- **US Cities**: Pre-configured major US cities for quick selection
- **Manual Entry**: Enter custom latitude/longitude coordinates
- **Location Display**: Shows current city and state

### Notifications
- **Browser Notifications**: Get notified before each prayer time
- **Customizable Timing**: Set reminders 5, 10, 15, or 30 minutes before prayer
- **Selective Prayers**: Choose which prayers to receive notifications for
- **Adhan Sound**: Optional adhan audio playback at prayer time

### User Interface
- **Beautiful Islamic Design**: Modern UI with Islamic geometric patterns
- **Hijri Date Display**: Shows both Gregorian and Hijri dates
- **Countdown Timer**: Real-time countdown to the next prayer
- **Weekly Schedule**: View prayer times for the entire week
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Additional Features
- **12/24 Hour Format**: Choose your preferred time display format
- **Settings Persistence**: All settings saved locally in your browser
- **Current Prayer Indicator**: Highlights the current prayer time
- **Next Prayer Display**: Shows upcoming prayer name and time

## Getting Started

### Option 1: GitHub Pages (Recommended)
1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Access the app at `https://your-username.github.io/prayer-times-app/`

### Option 2: Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/prayer-times-app.git
   ```
2. Open `index.html` in your web browser
3. Allow location access when prompted

### Option 3: Local Server
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```
Then open `http://localhost:8000`

## Configuration

### Calculation Methods

| Method | Fajr Angle | Isha Angle | Used By |
|--------|------------|------------|---------|
| ISNA | 15 | 15 | North America |
| MWL | 18 | 17 | Europe, Far East |
| Egyptian | 19.5 | 17.5 | Africa, Middle East |
| Makkah | 18.5 | 90 min | Arabian Peninsula |
| Karachi | 18 | 18 | Pakistan, India |
| Tehran | 17.7 | 14 | Iran |

### Enabling Notifications

1. Click "Enable Notifications" banner or go to Settings
2. Allow browser notification permission when prompted
3. Customize notification timing and select which prayers to be notified for

### Setting Your Location

**Auto-Detection:**
- Select "Auto-detect (GPS)" in Location settings
- Allow location access in your browser

**Select US City:**
- Choose "Select US City" in Location settings
- Pick your city from the dropdown list

**Manual Entry:**
- Select "Manual Entry" in Location settings
- Enter latitude and longitude coordinates
- Click "Update Location"

## Technical Details

### Files Structure
```
prayer-times-app/
├── index.html         # Main application page
├── namaz-styles.css   # Styling and themes
├── namaz-app.js       # Application logic
└── README.md          # Documentation
```

### Technologies Used
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid, Flexbox, and Custom Properties
- **JavaScript (ES6+)**: Prayer calculations, notifications, and interactivity
- **Geolocation API**: Location detection
- **Notifications API**: Browser push notifications
- **LocalStorage**: Settings persistence
- **Google Fonts**: Amiri (Arabic) and Inter (UI) fonts
- **Font Awesome**: Icons

### Prayer Time Algorithm
The app uses the standard astronomical formula for calculating prayer times:
1. **Fajr**: When the sun is at a specific angle below the horizon (varies by method)
2. **Sunrise**: When the sun's upper limb appears on the horizon
3. **Dhuhr**: When the sun crosses the meridian
4. **Asr**: When an object's shadow equals its height (Standard) or twice its height (Hanafi)
5. **Maghrib**: At sunset
6. **Isha**: When the sun is at a specific angle below the horizon (varies by method)

## Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome for Android)

## Privacy
- All data is stored locally in your browser
- Location data is only used for prayer time calculations
- No personal data is sent to external servers

## Email Reminders Setup (EmailJS)

The app uses [EmailJS](https://www.emailjs.com/) for sending email reminders - a free client-side email service.

### Step 1: Create EmailJS Account
1. Go to [emailjs.com](https://www.emailjs.com/) and sign up (free tier: 200 emails/month)
2. Verify your email address

### Step 2: Add Email Service
1. Go to **Email Services** in your EmailJS dashboard
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the connection instructions
5. Note down your **Service ID** (e.g., `service_xxxxxxx`)

### Step 3: Create Email Template
1. Go to **Email Templates** in your EmailJS dashboard
2. Click **Create New Template**
3. Set up your template with these variables:
   - `{{to_email}}` - Recipient email
   - `{{prayer_name}}` - Name of the prayer (Fajr, Dhuhr, etc.)
   - `{{prayer_time}}` - Time of the prayer
   - `{{location}}` - User's location
   - `{{date}}` - Gregorian date
   - `{{hijri_date}}` - Islamic date

**Example Template:**
```
Subject: Prayer Reminder: {{prayer_name}} at {{prayer_time}}

Assalamu Alaikum,

This is a reminder that {{prayer_name}} prayer time is approaching.

Prayer Time: {{prayer_time}}
Location: {{location}}
Date: {{date}}
Hijri Date: {{hijri_date}}

May Allah accept your prayers.

- Namaz Prayer Reminder App
```

4. Save and note down your **Template ID** (e.g., `template_xxxxxxx`)

### Step 4: Get Your Public Key
1. Go to **Account** > **General** in EmailJS dashboard
2. Copy your **Public Key**

### Step 5: Configure in App
1. Open the Namaz Reminder app
2. Go to **Settings** > **Email Reminders**
3. Enable email reminders
4. Enter your email address
5. Enter your EmailJS credentials:
   - Public Key
   - Service ID
   - Template ID
6. Click **Save Email Settings**
7. Click **Send Test Email** to verify

## Contributing
Contributions are welcome! Please feel free to submit issues or pull requests.

## License
This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments
- Prayer time calculation algorithms based on established Islamic astronomical methods
- Hijri calendar conversion algorithms
- The Muslim community for feedback and suggestions

## Contact
**Md Saiful Islam**
- Email: md-saiful.islam1@louisiana.edu
- LinkedIn: [Md Saiful Islam](https://linkedin.com/in/md-saiful-islam)

---

*"Indeed, prayer has been decreed upon the believers a decree of specified times."* - Quran 4:103

Built with dedication for the Muslim community in the United States.
