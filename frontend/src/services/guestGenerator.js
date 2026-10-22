// Generator for 500 realistic random guests for Rohan Varma & Priya Desai (wedding_02)

const FIRST_NAMES_MALE = [
  "Aarav", "Rohan", "Aditya", "Kabir", "Vihaan", "Aryan", "Reyansh", "Ishaan",
  "Vivaan", "Dhruv", "Arjun", "Shivam", "Yash", "Shreyas", "Parth", "Tanmay",
  "Varun", "Aniket", "Rishabh", "Siddharth", "Nikhil", "Karan", "Sameer", "Kunal",
  "Alok", "Mohit", "Gaurav", "Hardik", "Dev", "Tushar", "Pranav", "Chirag",
  "Harshit", "Vikrant", "Akshay", "Rahul", "Vikram", "Manan", "Ayush", "Raghav",
  "Abhinav", "Aman", "Sahil", "Nishant", "Mayank", "Harsh", "Deep", "Saurabh",
  "Tarun", "Vishal", "Kailash", "Bhavin", "Jatin", "Omkar", "Chetan"
];

const FIRST_NAMES_FEMALE = [
  "Priya", "Ananya", "Diya", "Ishita", "Riya", "Sneha", "Pooja", "Tanvi",
  "Shreya", "Simran", "Neha", "Meera", "Aditi", "Kavya", "Kiara", "Tara",
  "Jiya", "Navya", "Avani", "Riddhi", "Radhika", "Kriti", "Mansi", "Sakshi",
  "Nisha", "Anjali", "Swati", "Payal", "Komal", "Divya", "Aashi", "Bhavna",
  "Sonali", "Aarti", "Nidhi", "Palak", "Muskan", "Isha", "Rashmi", "Juhi",
  "Rupal", "Garima", "Natasha", "Shruti", "Sanya", "Trisha", "Parul", "Meghna",
  "Kajal", "Suman", "Deepika", "Shalini", "Pooja", "Urvi", "Payal"
];

const LAST_NAMES = [
  "Desai", "Varma", "Sharma", "Patel", "Mehta", "Shah", "Joshi", "Kulkarni",
  "Iyer", "Nair", "Reddy", "Rao", "Kapoor", "Malhotra", "Khanna", "Bhatia",
  "Chopra", "Singhania", "Bansal", "Mittal", "Agarwal", "Gupta", "Jain", "Goel",
  "Verma", "Mishra", "Pandey", "Tiwari", "Shukla", "Dubey", "Roy", "Sen",
  "Das", "Mukherjee", "Banerjee", "Ghosh", "Chatterjee", "Bose", "Dutta", "Thakur",
  "Chauhan", "Rajput", "Rawat", "Bisht", "Negi", "Gill", "Sandhu", "Dhillon",
  "Sidhu", "Grewal", "Bhattacharya", "Sood", "Dhar", "Kashyap", "Lal"
];

const FLIGHTS_ARRIVAL = [
  "6E-241", "6E-532", "AI-682", "AI-840", "UK-842", "UK-921",
  "QP-1102", "SG-415", "Vande Bharat (22230)", "Tejas Exp (22119)"
];

const FLIGHTS_DEPARTURE = [
  "6E-244", "6E-533", "AI-894", "AI-841", "UK-845", "UK-922",
  "QP-1105", "SG-416", "Vande Bharat (22229)", "Tejas Exp (22120)"
];

const LOCATIONS = [
  "Goa Dabolim Airport (GOI)",
  "Goa Mopa Int. Airport (GOX)",
  "Madgaon Railway Station (MAO)",
  "Thivim Railway Station (THVM)",
];

const TIMES = [
  "08:30 AM", "09:45 AM", "11:15 AM", "01:00 PM",
  "02:45 PM", "04:30 PM", "06:15 PM", "08:00 PM", "09:45 PM"
];

const SPECIAL_REQUESTS = [
  "Sea-facing room preference at Taj Exotica",
  "Vegetarian breakfast & Jain dinner option",
  "Airport shuttle / cab pickup requested",
  "Early check-in required (traveling with kids)",
  "Ground floor room requested for elderly parents",
  "Extra bed and baby crib needed",
  "Strict Jain food preparation",
  "Allergic to peanuts & gluten-free requested",
  "Hotel cab needed for sightseeing in South Goa",
  "",
  "",
  "",
];

export function generate500GuestsForRohanPriya() {
  const guests = [];
  const weddingId = "wedding_02";

  for (let i = 1; i <= 500; i++) {
    const isFemale = (i * 7 + 13) % 2 === 0;
    const firstNames = isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
    const firstName = firstNames[(i * 3 + 7) % firstNames.length];
    const lastName = LAST_NAMES[(i * 5 + 11) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;

    const isBride = i % 2 === 0;
    const side = isBride ? "Bride" : "Groom";

    // RSVP Distribution: ~76% Confirmed, ~17% Pending, ~7% Declined
    let rsvpStatus = "Confirmed";
    const rsvpMod = (i * 11) % 100;
    if (rsvpMod < 76) {
      rsvpStatus = "Confirmed";
    } else if (rsvpMod < 93) {
      rsvpStatus = "Pending";
    } else {
      rsvpStatus = "Declined";
    }

    // Travel Dates: Dec 13, 14, 15 for arrival, Dec 16, 17 for departure
    const arrDateIndex = (i * 3) % 3; // 0, 1, 2
    const arrivalDate = arrDateIndex === 0 ? "2026-12-13" : arrDateIndex === 1 ? "2026-12-14" : "2026-12-15";
    const depDateIndex = (i * 2) % 2;
    const departureDate = depDateIndex === 0 ? "2026-12-16" : "2026-12-17";

    const arrFlight = FLIGHTS_ARRIVAL[(i * 3) % FLIGHTS_ARRIVAL.length];
    const depFlight = FLIGHTS_DEPARTURE[(i * 5) % FLIGHTS_DEPARTURE.length];
    const arrTime = TIMES[(i * 4) % TIMES.length];
    const depTime = TIMES[(i * 6) % TIMES.length];
    const location = LOCATIONS[(i * 2) % LOCATIONS.length];

    // Phone number
    const p1 = 98000 + ((i * 17) % 1999);
    const p2 = 10000 + ((i * 31) % 89999);
    const contact = `+91 ${p1} ${p2}`;

    // ID Card
    const hasId = (i * 9) % 10 < 7;
    const idCardReceived = hasId ? "Yes" : "No";
    const idCardCopy = hasId && (i % 3 === 0) ? "government_id_verified.pdf" : null;

    // Call desk tracking
    const callCount = rsvpStatus === "Confirmed" ? (i % 3) + 1 : rsvpStatus === "Pending" ? (i % 2) + 1 : 1;
    const callStatus =
      rsvpStatus === "Confirmed"
        ? "RSVP Confirmed"
        : rsvpStatus === "Declined"
        ? "Declined RSVP"
        : "Connected";

    const specialReq = SPECIAL_REQUESTS[(i * 7) % SPECIAL_REQUESTS.length];

    const callSummaries = [
      `Guest confirmed arrival at ${location} via ${arrFlight}. Shuttle requested.`,
      `Confirmed stay at Taj Exotica Goa for 3 days. Dietary preferences noted.`,
      `Spoke with guest. Confirmed 2 attendees from ${side}'s family.`,
      `Verified flight tickets. Room allocation preference noted.`,
      `Guest requested callback to confirm departure flight timing.`,
      `Confirmed attendance for Sangeet & Beachside Wedding reception.`,
    ];
    const lastCallSummary = callSummaries[(i * 2) % callSummaries.length];

    guests.push({
      id: `guest_rohan_priya_${String(i).padStart(3, "0")}`,
      wedding_id: weddingId,
      sr_no: i,
      guest_name: fullName,
      contact: contact,
      side: side,
      rsvp_status: rsvpStatus,
      id_card_received: idCardReceived,
      arrival_date: arrivalDate,
      arrival_time: arrTime,
      arrival_location: location,
      arrival_flight_train_no: arrFlight,
      departure_date: departureDate,
      departure_time: depTime,
      departure_location: location,
      departure_flight_train_no: depFlight,
      id_card_copy: idCardCopy,
      special_request: specialReq || null,
      call_count: callCount,
      call_status: callStatus,
      last_called_at: new Date(Date.now() - (i % 7) * 86400000).toISOString(),
      last_call_summary: lastCallSummary,
      created_at: new Date(Date.now() - (500 - i) * 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return guests;
}
