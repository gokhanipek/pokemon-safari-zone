// Day-based asylum campaign model.
// The run is a fixed span of days. Each completed match advances the day by one;
// playing through the final day releases the player (the win state). Losing only
// advances the day, so there is no fail state.

// The first day of a campaign.
export const FIRST_DAY = 1;

// Total number of days in a campaign. Playing through the final day earns release.
export const CAMPAIGN_LENGTH_DAYS = 30;

/**
 * The day after the given one.
 * @param {number} day
 * @returns {number}
 */
export function advanceDay(day) {
  return day + 1;
}

/**
 * Whether the player has been released: true once the campaign span has been
 * played through (the day counter has passed the final day).
 * @param {number} day
 * @returns {boolean}
 */
export function isReleased(day) {
  return day > CAMPAIGN_LENGTH_DAYS;
}
