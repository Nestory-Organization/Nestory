// @ts-check
const path = require("path");
const { test, expect } = require("@playwright/test");

const {
  getDateKey,
  readingProgressPercentRounded,
  currentStreakFromSortedDayKeys,
} = require(path.join(__dirname, "../../backend/utils/readingAnalytics"));

test.describe("readingAnalytics (pure helpers)", () => {
  test("getDateKey normalizes to local midnight", () => {
    const a = new Date("2026-04-10T15:30:00Z");
    const b = new Date("2026-04-10T02:00:00Z");
    expect(getDateKey(a)).toBe(getDateKey(b));
  });

  test("readingProgressPercentRounded handles edge cases", () => {
    expect(readingProgressPercentRounded(3, 0)).toBe(0);
    expect(readingProgressPercentRounded(3, null)).toBe(0);
    expect(readingProgressPercentRounded(7, 10)).toBe(70);
    expect(readingProgressPercentRounded(1, 3)).toBe(33.33);
  });

  test("currentStreakFromSortedDayKeys", () => {
    expect(currentStreakFromSortedDayKeys([])).toBe(0);
    expect(currentStreakFromSortedDayKeys([1000])).toBe(1);
    const day = (y, m, d) => getDateKey(new Date(y, m - 1, d, 15, 0, 0, 0));
    const keys = [day(2026, 4, 8), day(2026, 4, 9), day(2026, 4, 10)].sort(
      (a, b) => a - b,
    );
    expect(currentStreakFromSortedDayKeys(keys)).toBe(3);
    const day2 = (y, m, d) => getDateKey(new Date(y, m - 1, d, 12, 0, 0, 0));
    const keys2 = [
      day2(2026, 4, 1),
      day2(2026, 4, 2),
      day2(2026, 4, 6),
      day2(2026, 4, 7),
      day2(2026, 4, 8),
    ].sort((a, b) => a - b);
    expect(currentStreakFromSortedDayKeys(keys2)).toBe(3);
  });
});
