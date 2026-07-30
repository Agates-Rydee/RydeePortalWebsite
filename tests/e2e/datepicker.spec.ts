import { test, expect, type ConsoleMessage } from "@playwright/test";

/**
 * P1 regression smoke: the DOB datepicker must open, allow picking a date
 * via the year+month dropdowns, close on select, and echo DD/MM/YYYY back
 * on the trigger. Also: zero console error/warning noise during the flow.
 *
 * Why this exists (docs/qa/iter4-review.md §"Iteration 4.2 addendum"):
 * the lazy `DatePickerPopover` chunk is deliberately never mounted in the
 * jsdom suite, so all 5 vitest-based gates structurally cannot catch a
 * runtime failure inside it (that's how the ref-as-prop Button shipped a
 * P1 — Radix Slot needed forwardRef and jsdom never rendered the anchor).
 * A minimal Chromium E2E closes that specific gap.
 */

test.describe("DOB datepicker (P1 regression)", () => {
  test("register page: opens, selects a date, closes with DD/MM/YYYY", async ({
    page,
  }) => {
    // Fail-fast on any console noise. Ignored: react-day-picker's benign
    // "You are using the DayPicker development build" info log if any
    // slips through; MSW's "[MSW] Mocking enabled" is a `log`, not warn.
    const noise: string[] = [];
    const record = (msg: ConsoleMessage) => {
      const t = msg.type();
      if (t === "error" || t === "warning") {
        noise.push(`[${t}] ${msg.text()}`);
      }
    };
    page.on("console", record);
    page.on("pageerror", (err) => noise.push(`[pageerror] ${err.message}`));

    await page.goto("/register");

    // Wait for MSW to be armed before interacting — first paint may race.
    await expect(
      page.getByRole("heading", { name: /^Register$/i }),
    ).toBeVisible();

    // The DOB trigger is the outline Button rendered by DatePickerField.
    // It carries id="reg-dob" and is labelled by the <Label htmlFor>.
    const trigger = page.locator("#reg-dob");
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText(/DD\/MM\/YYYY/);

    // Radix popover content only mounts after click.
    await trigger.click();
    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await expect(popover).toBeVisible();

    // Caption is the dropdown-buttons layout — two native <select>s
    // overlayed on the visible pill (see ui/calendar.tsx). Pick a
    // deterministic month + year within the allowed 18+ window.
    const currentYear = new Date().getFullYear();
    const pickYear = String(currentYear - 25);
    const monthSelect = popover.locator("select.rdp-dropdown_month, select[name='months']").first();
    const yearSelect  = popover.locator("select.rdp-dropdown_year,  select[name='years']").first();
    await expect(monthSelect).toBeAttached();
    await expect(yearSelect).toBeAttached();
    await monthSelect.selectOption({ label: "June" });
    await yearSelect.selectOption(pickYear);

    // Click day 15. rdp v8 renders days as <button> inside role=gridcell;
    // accessible name may be the localized full date, so match by exact
    // text content scoped to a gridcell, excluding adjacent-month cells
    // (rdp marks those with aria-disabled or rdp-day_outside).
    // rdp v8 exposes days as role=gridcell with the day number as
    // its accessible name; the clickable target IS the gridcell.
    const day15 = popover.getByRole('gridcell', { name: '15' }).first();
    await day15.click();

    // Popover closes on select, trigger shows DD/MM/YYYY.
    await expect(popover).toHaveCount(0);
    await expect(trigger).toHaveText(new RegExp(`15/06/${pickYear}`));

    // Zero console noise across the whole flow.
    expect(noise, `Console noise:\n${noise.join("\n")}`).toEqual([]);
  });
});
