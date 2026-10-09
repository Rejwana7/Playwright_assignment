import { expect, type Locator, type Page } from '@playwright/test';

export class AdminUserManagementPage {
  static readonly PATH = '/admin/users';

  readonly page: Page;
  readonly pageHeading: Locator;
  readonly searchTypeSelect: Locator;
  readonly emailSearchInput: Locator;
  readonly searchButton: Locator;
  readonly editUserButton: Locator;
  readonly accountStatusSelect: Locator;
  readonly saveChangesButton: Locator;
  readonly updateSuccessMessage: Locator;
  readonly activeStatus: Locator;
  readonly accountMenu: Locator;
  readonly logoutMenuItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByText('User List', { exact: true }).first();
    this.searchTypeSelect = page.getByRole('combobox').first();
    this.emailSearchInput = page.getByRole('textbox', { name: 'Enter Email' });
    this.searchButton = page.getByRole('button', {
      name: 'Search',
      exact: true,
    });
    this.editUserButton = page.getByRole('button', { name: 'Edit User' });
    this.accountStatusSelect = page.getByRole('combobox').nth(1);
    this.saveChangesButton = page.getByRole('button', {
      name: 'Save Changes',
    });
    this.updateSuccessMessage = page.getByText('User updated successfully', {
      exact: true,
    });
    this.activeStatus = page.getByText('ACTIVE', { exact: true }).first();
    this.accountMenu = page.getByText('Admin', { exact: true }).first();
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
  }

  async open(): Promise<void> {
    await this.page.goto(AdminUserManagementPage.PATH);
    await expect(this.pageHeading).toBeVisible();
  }

  // Returns the user table row that contains the Agent's unique email.
  getUserRow(email: string): Locator {
    return this.page .getByRole('row').filter({ has: this.page.getByText(email, { exact: true }) });
  }

  async searchAgentByEmail(email: string): Promise<void> {
    // The generated email uniquely identifies the newly registered Agent.
    await this.searchTypeSelect.click();
    await this.page
      .getByRole('option', { name: 'Search by Email' })
      .click();
    await this.emailSearchInput.fill(email);
    await this.searchButton.click();
    await expect(this.getUserRow(email)).toBeVisible();
  }

  async verifyAgentIsListedAndPending(email: string): Promise<void> {
    const agentRow = this.getUserRow(email);

    await expect(agentRow).toBeVisible();
    await expect(agentRow).toContainText('Agent');
    await expect(agentRow).toContainText('PENDING');
  }

  async activateAgent(email: string): Promise<void> {
    const agentRow = this.getUserRow(email);

    await agentRow.getByRole('button', { name: 'View' }).click();
    await this.editUserButton.click();

    // Role is the first dropdown and Account Status is the second.
    await this.accountStatusSelect.click();
    await this.page
      .getByRole('option', { name: 'Active', exact: true })
      .click();
    await this.saveChangesButton.click();

    await expect(this.updateSuccessMessage).toBeVisible();
    await expect(this.activeStatus).toBeVisible();
  }

  // Confirms the Agent's active status persists after a page reload.
  async verifyAgentRemainsActiveAfterReload(): Promise<void> {
    await this.page.reload();
    await expect(this.activeStatus).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.accountMenu.click();
    await this.logoutMenuItem.click();
    await expect(this.page).toHaveURL('/login');
  }
}
