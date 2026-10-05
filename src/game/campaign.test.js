import {
  FIRST_DAY, CAMPAIGN_LENGTH_DAYS, advanceDay, isReleased,
} from './campaign';

describe('campaign model', () => {
  it('starts on day 1', () => {
    expect(FIRST_DAY).toBe(1);
  });

  it('advances the day by one', () => {
    expect(advanceDay(FIRST_DAY)).toBe(2);
    expect(advanceDay(29)).toBe(30);
  });

  it('is not released during the span', () => {
    expect(isReleased(FIRST_DAY)).toBe(false);
    expect(isReleased(CAMPAIGN_LENGTH_DAYS)).toBe(false);
  });

  it('is released only after the final day', () => {
    // Completing the day-30 match advances the day to 31, which is release.
    expect(isReleased(advanceDay(CAMPAIGN_LENGTH_DAYS))).toBe(true);
    expect(isReleased(CAMPAIGN_LENGTH_DAYS + 1)).toBe(true);
  });
});
