import { expect, type Locator, type Page } from '@playwright/test';

export class TransactionHistoryPage {
  static readonly PATH = '/admin/transactions';

  readonly page: Page;
  readonly pageHeading: Locator;
  readonly phoneSearchInput: Locator;
  readonly searchButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByText('Transaction Lookup', { exact: true });
    this.phoneSearchInput = page.locator(
      'input[placeholder="e.g. 01686606901"]',
    );
    this.searchButton = page.getByRole('button', {
      name: 'Search',
      exact: false,
    });
    this.tableRows = page.locator('tbody tr');
  }

  async open(): Promise<void> {
    await this.page.goto(TransactionHistoryPage.PATH);
    await expect(this.pageHeading).toBeVisible();
  }

  getTransactionRow(account: string, transactionType: string): Locator {
    return this.tableRows
      .filter({ hasText: account })
      .filter({ hasText: transactionType });
  }

  async searchByPhone(phoneNumber: string): Promise<void> {
    await this.phoneSearchInput.fill(phoneNumber);
    await this.searchButton.click();
    await expect(this.tableRows.first()).toBeVisible();
  }

  async verifySystemDeposit(
    agentPhoneNumber: string,
    amount: number,
  ): Promise<void> {
    const transactionRow = this.getTransactionRow(
      agentPhoneNumber,
      'Top-up from SYSTEM',
    );

    await expect(transactionRow).toBeVisible();
    await expect(transactionRow).toContainText('SYSTEM');
    await expect(transactionRow).toContainText(amount.toFixed(2));
  }

  async verifyAccountBalance(expectedBalance: number): Promise<void> {
    await expect(
      this.page.getByText(`৳ ${expectedBalance.toFixed(2)}`, { exact: true }),
    ).toBeVisible();
  }
}
