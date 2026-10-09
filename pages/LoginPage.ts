import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  static readonly PATH = '/login';

  readonly page: Page;
  readonly pageHeading: Locator;
  readonly emailOrPhoneInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginErrorMessage: Locator;
  readonly otpInput: Locator;
  readonly verifyOtpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByRole('heading', { name: 'Welcome Back' });
    this.emailOrPhoneInput = page.getByRole('textbox', {
      name: 'Email or Phone Number',
    });
    // Password inputs do not expose the textbox role.
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.loginErrorMessage = page.getByText(
      'Login failed. Please input correct email/phone number or password.',
      { exact: true },
    );
    this.otpInput = page.getByRole('textbox', {
      name: 'Enter 4-Digit OTP',
    });
    this.verifyOtpButton = page.getByRole('button', {
      name: 'Verify OTP',
      exact: false,
    });
  }

  async open(): Promise<void> {
    await this.page.goto(LoginPage.PATH);
  }

  async login(emailOrPhone: string, password: string): Promise<void> {
    await this.fillCredentials(emailOrPhone, password);
    await this.submitLogin();
  }

  async fillCredentials(
    emailOrPhone: string,
    password: string,
  ): Promise<void> {
    await this.emailOrPhoneInput.fill(emailOrPhone);
    await this.passwordInput.fill(password);
  }

  async submitLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async verifyOtpIsRequested(): Promise<void> {
    await expect(this.otpInput).toBeVisible();
    await expect(this.verifyOtpButton).toBeVisible();
  }

  async submitOtp(otp: string): Promise<void> {
    await this.otpInput.fill(otp);
    await this.verifyOtpButton.click();
  }

  async verifyAdminLoginIsSuccessful(): Promise<void> {
    await expect(this.page).toHaveURL('/profile');
    await expect(
      this.page.getByText('Admin Dashboard', { exact: true }),
    ).toBeVisible();
  }

  async verifyLoginFails(): Promise<void> {
    await expect(this.loginErrorMessage).toBeVisible();
    await expect(this.page).toHaveURL('/login');
  }
}
