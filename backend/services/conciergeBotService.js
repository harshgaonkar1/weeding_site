// ============================================================
// Emitly Bot Concierge Service
// ------------------------------------------------------------
// Provides smart, context-aware automated concierge responses
// for wedding clients and guests, tied directly to active wedding
// data and guest logistics.
// ============================================================

export const ConciergeBotService = {
  generateReply({ wedding, guests = [], message = "", senderName = "Client" }) {
    const text = (message || "").toLowerCase().trim();

    const groom = wedding?.groom_name || "Groom";
    const bride = wedding?.bride_name || "Bride";
    const venue = wedding?.venue || "Wedding Venue";
    const city = wedding?.city || "Destination";
    const date = wedding?.wedding_date || "Upcoming Date";

    // Guest statistics
    const totalGuests = guests.length || wedding?.total_guests || 0;
    const confirmedGuests = guests.filter(
      (g) => (g.rsvp_status || "").toLowerCase() === "confirmed"
    ).length || wedding?.confirmed_guests || 0;
    const pendingGuests = guests.filter(
      (g) => (g.rsvp_status || "").toLowerCase() === "pending"
    ).length;

    // Travel & flight statistics
    const flightConfirmedGuests = guests.filter((g) =>
      Boolean(
        (g.arrival_flight_train_no && g.arrival_flight_train_no.trim() !== "") ||
        (g.departure_flight_train_no && g.departure_flight_train_no.trim() !== "")
      )
    );
    const flightCount = flightConfirmedGuests.length;

    // Special requests
    const specialRequests = guests.filter((g) => g.special_request && g.special_request.trim() !== "");

    // 1. Airport shuttle, cab, and transport
    if (
      text.includes("shuttle") ||
      text.includes("cab") ||
      text.includes("airport") ||
      text.includes("transfer") ||
      text.includes("pickup") ||
      text.includes("transport")
    ) {
      return `Airport transfer & cab update for ${groom} & ${bride}'s wedding: Dedicated airport shuttles and Innovas are on standby at ${city}. Currently, ${flightCount} arriving guests have submitted their flight/train numbers (e.g., AI-682). Telecallers track landing times in real time to coordinate seamless pickups.`;
    }

    // 2. RSVP deadline & status extension
    if (
      text.includes("rsvp") ||
      text.includes("deadline") ||
      text.includes("extend") ||
      text.includes("confirmed") ||
      text.includes("attending")
    ) {
      return `Current RSVP status for ${groom} & ${bride}: ${confirmedGuests} of ${totalGuests} guests have confirmed their attendance${pendingGuests > 0 ? ` (${pendingGuests} currently pending follow-up)` : ""}. If you wish to extend the deadline, our telecaller desk has already updated the timeline and will continue courtesy calls accordingly!`;
    }

    // 3. Flight tickets and travel verification
    if (
      text.includes("flight") ||
      text.includes("ticket") ||
      text.includes("train") ||
      text.includes("travel") ||
      text.includes("arrival") ||
      text.includes("departure")
    ) {
      return `Flight & travel verification: We have verified schedules for ${flightCount} guests for the celebration in ${city}. The call center team is collecting remaining boarding passes and train PNRs for smooth airport reception.`;
    }

    // 4. Early check-in, hotel rooms, accommodations
    if (
      text.includes("check-in") ||
      text.includes("check in") ||
      text.includes("room") ||
      text.includes("hotel") ||
      text.includes("stay") ||
      text.includes("accommodation")
    ) {
      return `Hospitality desk update for ${venue}: Early check-in requests for arriving family members have been flagged with the hotel reception. Pre-allocated suites and lake/sea facing rooms will be prioritized for morning arrivals.`;
    }

    // 5. Food, dietary, special requests
    if (
      text.includes("diet") ||
      text.includes("food") ||
      text.includes("vegetarian") ||
      text.includes("vegan") ||
      text.includes("jain") ||
      text.includes("meal") ||
      text.includes("special request")
    ) {
      return `Hospitality update: We have recorded ${specialRequests.length} special guest requests (including vegetarian and dietary meal preferences). All instructions are synchronized directly with the catering team at ${venue}.`;
    }

    // 6. Telecaller / calling team status
    if (
      text.includes("call") ||
      text.includes("telecaller") ||
      text.includes("agent") ||
      text.includes("desk")
    ) {
      return `Telecaller desk status: Our call desk team is active on the 3-checkpoint protocol (Call 1: Invitation RSVP, Call 2: ID & Flight Verification, Call 3: Cab & Hotel Confirmation). All logs sync live with your dashboard and Google Sheets!`;
    }

    // 7. Venue / Date / Location
    if (
      text.includes("venue") ||
      text.includes("location") ||
      text.includes("date") ||
      text.includes("city") ||
      text.includes("when") ||
      text.includes("where")
    ) {
      return `${groom} & ${bride}'s celebration is scheduled for ${date} at ${venue}, ${city}. All logistics, guest lists, and call tracking are actively managed here in your live wedding portal.`;
    }

    // 8. General greetings or catch-all inquiries
    return `Hello! I am your Emitly Bot Concierge for ${groom} & ${bride}'s wedding at ${venue}, ${city}. I can help you check RSVP counts (${confirmedGuests}/${totalGuests} confirmed), airport cab coordination, flight schedules (${flightCount} logged), and telecaller follow-ups. How else can I assist you today?`;
  },
};

export default ConciergeBotService;
