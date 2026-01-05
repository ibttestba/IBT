# Gaming_Workshop_AF2026
A web app for booking gaming workshop slots. Users select a date, time, and game, then register with name, email, and WWID. Slots show real-time availability and allow up to 4 participants. Registration data is stored locally, with validation for unique email and WWID. Easy event management.
Gaming Workshop Registration
A web application for booking slots in a multi-day gaming workshop. Users can select a date, time slot, and preferred game, then register with their name, email, and WWID. The system manages slot availability, validates registrations, and provides a user-friendly interface for event management.
Features
•	Interactive Registration: View available slots and book a 2-hour gaming session.
•	Slot Management: Each slot supports up to 4 participants, with real-time availability updates.
•	Form Validation: Ensures unique registration by email and WWID, and validates user input.
•	Local Data Storage: Registration data is stored in the browser using localStorage.
•	Admin & Dashboard Pages: Extendable for live dashboard and admin management.
•	Easy Setup: No backend required for basic registration; backend integration recommended for email/calendar features.
How It Works
1.	Select Date: Choose a date within the workshop period (Dec 15, 2025 – Mar 15, 2026).
2.	Pick a Slot: View available 2-hour slots (9:00 AM – 7:00 PM).
3.	Register: Enter your details and select a game to test.
4.	Confirmation: Registration is validated and saved locally; details are shown for your reference.
File Structure
Gaming workshop/
├── index.html         # Main registration page
├── dashboard.html     # Dashboard view (extendable)
├── admin.html         # Admin panel (extendable)
├── Script.js          # Main JavaScript logic
├── dashboard.js       # Dashboard logic (if used)
├── admin.js           # Admin logic (if used)
├── styles.css         # Stylesheet

Setup & Usage
1.	Clone the repository:
git clone https://github.com/YOUR_USERNAME/gaming-workshop.git
2.	Open index.html in your browser.
3.	Register for a slot and test the features.
Extending the Project
•	Email Confirmation & Calendar Booking:
To send confirmation emails and add bookings to a calendar, integrate a backend (Node.js/Express recommended) with email (Nodemailer) and calendar (Google Calendar API) support.
•	Deployment:
Host the project on GitHub Pages or any static site hosting service for frontend-only usage.
Requirements
•	Modern web browser (Chrome, Edge, Firefox, etc.)
•	No backend required for basic usage
