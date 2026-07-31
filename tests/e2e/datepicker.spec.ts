import { test, expect, type ConsoleMessage } from "@playwright/test";

test.describe("DOB datepicker (P1 regression)", () => {
  test("register page: opens, selects a date, closes with DD/MM/YYYY", async ({
    page,
  }) => {
    // Collect only error- and warning-level console messages. The mock service
    // worker's startup line is emitted as `log` and is therefore ignored, which
    // keeps the assertion focused on real failures rather than dev-mode chatter.
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

    await expect(
      page.getByRole("heading", { name: /^Register$/i }),
    ).toBeVisible();

    const trigger = page.locator("#reg-dob");
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText(/DD\/MM\/YYYY/);

    await trigger.click();
    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await expect(popover).toBeVisible();

    // Pick a fixed month and a year that sits inside the age-18 window so the
    // assertion below matches deterministically regardless of the wall clock.
    const currentYear = new Date().getFullYear();
    const pickYear = String(currentYear - 25);
    const monthSelect = popover.locator("select.rdp-dropdown_month, select[name='months']").first();
    const yearSelect  = popover.locator("select.rdp-dropdown_year,  select[name='years']").first();
    await expect(monthSelect).toBeAttached();
    await expect(yearSelect).toBeAttached();
    await monthSelect.selectOption({ label: "June" });
    await yearSelect.selectOption(pickYear);

    const day15 = popover.getByRole('gridcell', { name: '15' }).first();
    await day15.click();

    await expect(popover).toHaveCount(0);
    await expect(trigger).toHaveText(new RegExp(`15/06/${pickYear}`));

    expect(noise, `Console noise:\n${noise.join("\n")}`).toEqual([]);
  });
});
