import { expect, type Locator, type Page } from '@playwright/test';

export class DepositPage {
  static readonly CASH_IN_PATH = '/agent/cash-in';

  readonly page: Page;
  readonly balanceButton: Locator;
  readonly receiverPhoneInput: Locator;
  readonly amountInput: Locator;
  readonly cashInButton: Locator;
  readonly successMessage: Locator;
  readonly transactionIdLabel: Locator;
  readonly totalAmountSection: Locator;
  readonly currentBalanceSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.balanceButton = page.getByRole('button', {
      name: 'Balance',
      exact: true,
    });
    this.receiverPhoneInput = page.getByRole('textbox', {
      name: 'Customer Phone Number',
    });
    this.amountInput = page.locator('input[name="amount"]');
    this.cashInButton = page.getByRole('button', { name: 'Cash In' });
    this.successMessage = page.getByText('successful', { exact: false }).last();
    this.transactionIdLabel = page.getByText('Transaction ID', { exact: true });
    this.totalAmountSection = page
      .getByText('Total Amount', { exact: true })
      .locator('..');
    this.currentBalanceSection = page
      .getByText('Current Balance', { exact: true })
      .locator('..');
  }

  async openCashIn(): Promise<void> {
    await this.page.goto(DepositPage.CASH_IN_PATH);
    await expect(this.cashInButton).toBeVisible();
  }

  async verifyAccountBalance(expectedBalance: number): Promise<void> {
    await this.balanceButton.click();
    await expect(
      this.page.getByRole('button', {
        name: `৳ ${expectedBalance.toFixed(2)}`,
        exact: true,
      }),
    ).toBeVisible();
  }

  async deposit(phoneNumber: string, amount: number): Promise<void> {
    await this.receiverPhoneInput.fill(phoneNumber);
    await this.amountInput.fill(String(amount));
    await this.cashInButton.click();
  }

  async depositToAgent(phoneNumber: string, amount: number): Promise<void> {
    await this.deposit(phoneNumber, amount);
  }

  async depositToCustomer(phoneNumber: string, amount: number): Promise<void> {
    await this.deposit(phoneNumber, amount);
  }

  async verifyDepositIsSuccessful(amount: number): Promise<void> {
    await expect(this.successMessage).toBeVisible();
    await expect(this.transactionIdLabel).toBeVisible();
    await expect(this.totalAmountSection).toContainText(amount.toFixed(2));
  }

  async verifyUpdatedBalance(expectedBalance: number): Promise<void> {
    await expect(this.currentBalanceSection).toContainText(
      expectedBalance.toFixed(2),
    );
  }
}
