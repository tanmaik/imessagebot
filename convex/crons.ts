import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for recurring reminders every minute
crons.interval(
  "check recurring reminders",
  { minutes: 1 },
  internal.reminderActions.checkRecurringReminders
);

export default crons;
