import { expect, type Locator, type Page } from '@playwright/test';

export class PasswordResetPage {
  static readonly FORGOT_PASSWORD_PATH = '/forgot-password';

  readonly page: Page;
  readonly forgotPasswordHeading: Locator;
  readonly emailOrPhoneInput: Locator;
  readonly sendResetLinkButton: Locator;
  readonly resetLinkSuccessMessage: Locator;
  readonly setNewPasswordHeading: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetPasswordButton: Locator;
  readonly passwordResetSuccessMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.forgotPasswordHeading = page.getByText('Forgot Password?', {
      exact: true,
    });
    this.emailOrPhoneInput = page.getByRole('textbox', {
      name: 'Email or Phone Number',
    });
    this.sendResetLinkButton = page.getByRole('button', {
      name: 'Send Reset Link',
      exact: false,
    });
    this.resetLinkSuccessMessage = page.getByText(
      'A password reset link has been sent to your registered Gmail address. Please check your inbox.',
      { exact: true },
    );
    this.setNewPasswordHeading = page.getByText('Set New Password', {
      exact: true,
    });
    this.newPasswordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.resetPasswordButton = page.getByRole('button', {
      name: 'Reset Password',
      exact: false,
    });
    this.passwordResetSuccessMessage = page.getByText(
      'Your password has been reset successfully',
      { exact: false },
    );
  }

  async requestResetLink(emailOrPhone: string): Promise<void> {
    await this.open();
    await this.fillResetIdentifier(emailOrPhone);
    await this.submitResetRequest();
    await this.verifyResetLinkIsSent();
  }

  async open(): Promise<void> {
    await this.page.goto(PasswordResetPage.FORGOT_PASSWORD_PATH);
    await expect(this.forgotPasswordHeading).toBeVisible();
  }

  async fillResetIdentifier(emailOrPhone: string): Promise<void> {
    await this.emailOrPhoneInput.fill(emailOrPhone);
  }

  async submitResetRequest(): Promise<void> {
    await this.sendResetLinkButton.click();
  }

  async verifyResetLinkIsSent(): Promise<void> {
    await expect(this.resetLinkSuccessMessage).toBeVisible();
  }

  async resetPassword(resetLink: string, newPassword: string): Promise<void> {
    await this.page.goto(resetLink);
    await expect(this.setNewPasswordHeading).toBeVisible();
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.resetPasswordButton.click();
    await expect(this.passwordResetSuccessMessage).toBeVisible();
    await expect(this.page).toHaveURL('/login', { timeout: 5_000 });
  }
}
