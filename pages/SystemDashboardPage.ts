import { expect, type Locator, type Page } from '@playwright/test';
import { DepositPage } from './DepositPage';

export class SystemDashboardPage extends DepositPage {
  readonly dashboardTitle: Locator;
  readonly systemName: Locator;
  readonly accountMenu: Locator;
  readonly logoutMenuItem: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardTitle = page.getByText('Agent Dashboard', { exact: true });
    this.systemName = page.getByText('SYSTEM', { exact: true }).first();
    this.accountMenu = this.systemName;
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
  }

  async verifySystemLoginIsSuccessful(): Promise<void> {
    await expect(this.page).toHaveURL('/profile');
    await expect(this.dashboardTitle).toBeVisible();
    await expect(this.systemName).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.accountMenu.click();
    await this.logoutMenuItem.click();
    await expect(this.page).toHaveURL('/login');
  }
}
