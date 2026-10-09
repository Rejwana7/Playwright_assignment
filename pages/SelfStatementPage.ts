import { expect, type Locator, type Page } from '@playwright/test';

export interface StatementTableData {
  headers: string[];
  rows: string[][];
}

export class SelfStatementPage {
  static readonly PATH = '/agent/self-statement';

  readonly page: Page;
  readonly pageHeading: Locator;
  readonly currentBalance: Locator;
  readonly fromDateInput: Locator;
  readonly toDateInput: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page
      .getByText('Transaction History', { exact: false })
      .last();
    this.currentBalance = page.getByText('Current Balance: BDT', {
      exact: false,
    });
    this.fromDateInput = page.getByRole('textbox', { name: 'From Date' });
    this.toDateInput = page.getByRole('textbox', { name: 'To Date' });
    this.tableHeaders = page.locator('thead th');
    this.tableRows = page.locator('tbody tr');
  }

  async open(): Promise<void> {
    await this.page.goto(SelfStatementPage.PATH);
    await expect(this.pageHeading).toBeVisible();
  }

  getTransactionRow(receiverAccount: string, transactionType: string): Locator {
    return this.tableRows
      .filter({ hasText: receiverAccount })
      .filter({ hasText: transactionType });
  }

  async verifyCurrentBalance(expectedBalance: number): Promise<void> {
    await expect(this.currentBalance).toContainText(expectedBalance.toFixed(2));
  }

  async filterTransactionsByDate(date: string): Promise<void> {
    await this.fromDateInput.fill(date);
    await this.toDateInput.fill(date);
    await expect(this.fromDateInput).toHaveValue(date);
    await expect(this.toDateInput).toHaveValue(date);
  }

  async verifyCustomerDeposit(
    customerPhoneNumber: string,
    amount: number,
    expectedBalance: number,
  ): Promise<void> {
    const transactionRow = this.getTransactionRow(
      customerPhoneNumber,
      'Deposit Commission',
    );

    await expect(transactionRow).toBeVisible();
    await expect(transactionRow).toContainText(amount.toFixed(2));
    await expect(transactionRow).toContainText(expectedBalance.toFixed(2));
  }

  async extractAllTableData(): Promise<StatementTableData> {
    const headers = await this.tableHeaders.allTextContents();
    const rows = await this.tableRows.evaluateAll((tableRows) =>
      tableRows.map((row) =>
        Array.from(row.querySelectorAll('td')).map(
          (cell) => (cell as HTMLElement).innerText.trim(),
        ),
      ),
    );

    return { headers, rows };
  }
}
