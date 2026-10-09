import { expect, type Locator, type Page } from '@playwright/test';
import { DepositPage } from './DepositPage';

export class AgentDashboardPage extends DepositPage {
  readonly dashboardTitle: Locator;
  readonly logoutMenuItem: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardTitle = page.getByText('Agent Dashboard', { exact: true });
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
  }

  async verifyAgentLoginIsSuccessful(agentName: string): Promise<void> {
    await expect(this.page).toHaveURL('/profile');
    await expect(this.dashboardTitle).toBeVisible();
    await expect(
      this.page.getByText(agentName, { exact: true }).first(),
    ).toBeVisible();
  }

  async logout(agentName: string): Promise<void> {
    const firstName = agentName.trim().split(' ')[0];
    const accountMenu = this.page
      .getByText(firstName, { exact: true })
      .first();

    await expect(accountMenu).toBeVisible();
    await accountMenu.click();
    await this.logoutMenuItem.click();
    await expect(this.page).toHaveURL('/login');
  }
}
