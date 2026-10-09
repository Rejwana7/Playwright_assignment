import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { AdminUserManagementPage } from '../pages/AdminUserManagementPage';
import { AgentDashboardPage } from '../pages/AgentDashboardPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { PasswordResetPage } from '../pages/PasswordResetPage';
import { SelfStatementPage } from '../pages/SelfStatementPage';
import { SignUpPage } from '../pages/SignUpPage';
import { SystemDashboardPage } from '../pages/SystemDashboardPage';
import { TransactionHistoryPage } from '../pages/TransactionHistoryPage';
import {
  adminUser,
  createRandomNewPassword,
  createRandomAgent,
  existingCustomer,
  systemUser,
  transactionData,
} from '../test_data/testData';
import { readAgentData, updateAgentData,writeAgentData,type StoredAgentData,} from '../utils/agentJson';
import { saveAuthState } from '../utils/authState';
import {
  filterStatementDataForToday,
  getDhakaDate,
  getStatementCsvFileName,
  saveStatementDataToCsv,
} from '../utils/csvHelper';
import { GmailReader } from '../utils/gmailReader';
import { SUITES } from '../utils/suites';

let browserInstance: Browser;
let browserContext: BrowserContext;
let page: Page;
let appBaseUrl: string;

const expectedBalanceAfterCustomerDeposit =
  transactionData.systemToAgentAmount -
  transactionData.agentToCustomerAmount +
  transactionData.agentToCustomerAmount * transactionData.agentCommissionRate;

async function loginAgentWithNewOtp(
  loginPage: LoginPage,
  gmailReader: GmailReader,
  agent: StoredAgentData,
): Promise<void> {
  await loginPage.open();
  await loginPage.fillCredentials(agent.email, agent.password);

  const previousOtpMessage = await gmailReader.getLatestOtpMessage(agent.email);
  const otpRequestedAt = Math.floor(Date.now() / 1000) * 1000;

  await loginPage.submitLogin();
  await loginPage.verifyOtpIsRequested();

  const otp = await gmailReader.waitForNewOtp({
    recipient: agent.email,
    previousMessageId: previousOtpMessage?.id,
    requestedAt: otpRequestedAt,
  });

  await loginPage.submitOtp(otp);
}

test.describe('DMoney full workflow', { tag: SUITES.regression }, () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(720_000);

  test.beforeAll(async ({ browser, baseURL }) => {
    if (!baseURL) {
      throw new Error('baseURL is missing from playwright.config.ts.');
    }

    browserInstance = browser;
    appBaseUrl = baseURL;
    browserContext = await browser.newContext({
      baseURL,
      timezoneId: 'Asia/Dhaka',
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: path.resolve('test-results', 'videos') },
    });
    page = await browserContext.newPage();
  });

  test.afterAll(async () => {
    await browserContext?.close();
  });

  test('registers and activates a new Agent', { tag: SUITES.smoke }, async () => {
    const homePage = new HomePage(page);
    const signUpPage = new SignUpPage(page);
    const loginPage = new LoginPage(page);
    const adminPage = new AdminUserManagementPage(page);
    const agent = createRandomAgent();

    await homePage.open();
    await homePage.verifyPageIsLoaded();
    await homePage.navigateToSignUp();
    await signUpPage.verifyPageIsLoaded();
    await signUpPage.registerUser(agent);
    await signUpPage.verifyRegistrationIsSuccessful();
    await signUpPage.verifyAccountIsPendingApproval();
    await writeAgentData({ ...agent, status: 'pending', balance: 0 });

    await loginPage.open();
    await loginPage.login(adminUser.email, adminUser.password);
    await loginPage.verifyAdminLoginIsSuccessful();
    await saveAuthState(browserContext);

    await adminPage.open();
    await adminPage.searchAgentByEmail(agent.email);
    await adminPage.verifyAgentIsListedAndPending(agent.email);
    await adminPage.activateAgent(agent.email);
    await adminPage.verifyAgentRemainsActiveAfterReload();
    await updateAgentData({ status: 'active' });
    await adminPage.logout();
  });

  test('System deposits 2000 Tk and creates the correct transaction', { tag: SUITES.smoke }, async () => {
    const agent = await readAgentData();
    const loginPage = new LoginPage(page);
    const systemPage = new SystemDashboardPage(page);

    await loginPage.open();
    await loginPage.login(systemUser.email, systemUser.password);
    await systemPage.verifySystemLoginIsSuccessful();
    await saveAuthState(browserContext);

    await systemPage.openCashIn();
    await systemPage.depositToAgent(
      agent.phoneNumber,
      transactionData.systemToAgentAmount,
    );
    await systemPage.verifyDepositIsSuccessful(
      transactionData.systemToAgentAmount,
    );
    await updateAgentData({ balance: transactionData.systemToAgentAmount });

    const adminAuditContext = await browserInstance.newContext({
      baseURL: appBaseUrl,
    });

    try {
      const adminAuditPage = await adminAuditContext.newPage();
      const adminAuditLogin = new LoginPage(adminAuditPage);
      const transactionHistory = new TransactionHistoryPage(adminAuditPage);

      await adminAuditLogin.open();
      await adminAuditLogin.login(adminUser.email, adminUser.password);
      await adminAuditLogin.verifyAdminLoginIsSuccessful();
      await transactionHistory.open();
      await transactionHistory.searchByPhone(agent.phoneNumber);
      await transactionHistory.verifySystemDeposit(
        agent.phoneNumber,
        transactionData.systemToAgentAmount,
      );
      await transactionHistory.verifyAccountBalance(
        transactionData.systemToAgentAmount,
      );
    } finally {
      await adminAuditContext.close();
    }

    await systemPage.logout();
  });

  test('Agent completes the Customer deposit flow and logs out', { tag: SUITES.smoke }, async () => {
    const agent = await readAgentData();
    const loginPage = new LoginPage(page);
    const agentPage = new AgentDashboardPage(page);
    const gmailReader = new GmailReader();
    const selfStatementPage = new SelfStatementPage(page);

    await loginAgentWithNewOtp(loginPage, gmailReader, agent);
    await agentPage.verifyAgentLoginIsSuccessful(agent.fullName);
    await saveAuthState(browserContext);
    await agentPage.verifyAccountBalance(transactionData.systemToAgentAmount);

    await agentPage.openCashIn();
    await agentPage.depositToCustomer(
      existingCustomer.phoneNumber,
      transactionData.agentToCustomerAmount,
    );
    await agentPage.verifyDepositIsSuccessful(
      transactionData.agentToCustomerAmount,
    );
    await agentPage.verifyUpdatedBalance(expectedBalanceAfterCustomerDeposit);
    await updateAgentData({
      balance: expectedBalanceAfterCustomerDeposit,
      lastCustomerPhone: existingCustomer.phoneNumber,
      lastDepositAmount: transactionData.agentToCustomerAmount,
    });

    await selfStatementPage.open();
    await selfStatementPage.filterTransactionsByDate(getDhakaDate());
    await selfStatementPage.verifyCurrentBalance(
      expectedBalanceAfterCustomerDeposit,
    );
    await selfStatementPage.verifyCustomerDeposit(
      existingCustomer.phoneNumber,
      transactionData.agentToCustomerAmount,
      expectedBalanceAfterCustomerDeposit,
    );
    await agentPage.logout(agent.fullName);
  });

  test('resets the Agent password using a new reset email', { tag: SUITES.smoke }, async () => {
    const agent = await readAgentData();
    const gmailReader = new GmailReader();
    const passwordResetPage = new PasswordResetPage(page);
    const newPassword = createRandomNewPassword();

    await passwordResetPage.open();
    await passwordResetPage.fillResetIdentifier(agent.email);

    const previousMessage =
      await gmailReader.getLatestMessageForRecipient(agent.email);
    const resetRequestedAt = Math.floor(Date.now() / 1000) * 1000;

    await passwordResetPage.submitResetRequest();
    await passwordResetPage.verifyResetLinkIsSent();

    const resetLink = await gmailReader.waitForNewResetLink({
      recipient: agent.email,
      previousMessageId: previousMessage?.id,
      requestedAt: resetRequestedAt,
    });

    await passwordResetPage.resetPassword(resetLink, newPassword);
    await updateAgentData({
      oldPassword: agent.password,
      password: newPassword,
    });
  });

  test('rejects the old Agent password after reset', async () => {
    const agent = await readAgentData();
    const loginPage = new LoginPage(page);

    if (!agent.oldPassword) {
      throw new Error('The old Agent password is missing from agent.json.');
    }

    await loginPage.open();
    await loginPage.login(agent.email, agent.oldPassword);
    await loginPage.verifyLoginFails();
  });

  test('logs in with a new OTP and exports today\'s Self Statement', { tag: SUITES.smoke }, async () => {
    const agent = await readAgentData();
    const loginPage = new LoginPage(page);
    const agentPage = new AgentDashboardPage(page);
    const gmailReader = new GmailReader();
    const selfStatementPage = new SelfStatementPage(page);

    await loginAgentWithNewOtp(loginPage, gmailReader, agent);
    await agentPage.verifyAgentLoginIsSuccessful(agent.fullName);
    await saveAuthState(browserContext);

    await selfStatementPage.open();
    await selfStatementPage.filterTransactionsByDate(getDhakaDate());
    await selfStatementPage.verifyCurrentBalance(
      expectedBalanceAfterCustomerDeposit,
    );
    await selfStatementPage.verifyCustomerDeposit(
      existingCustomer.phoneNumber,
      transactionData.agentToCustomerAmount,
      expectedBalanceAfterCustomerDeposit,
    );

    const statementData = await selfStatementPage.extractAllTableData();
    expect(statementData.headers).toEqual([
      'Transaction ID',
      'Sender Account',
      'Receiver Account',
      'Type',
      'Debit',
      'Credit',
      'Balance',
      'Date',
    ]);
    expect(statementData.rows.length).toBeGreaterThan(0);

    const todaysStatementData = filterStatementDataForToday(statementData);
    expect(todaysStatementData.rows.length).toBeGreaterThan(0);
    expect(
      todaysStatementData.rows.some(
        (row) =>
          row.some((cell) => cell.includes(existingCustomer.phoneNumber)) &&
          row.some((cell) => cell.includes('Deposit Commission')),
      ),
    ).toBe(true);

    const csvPath = await saveStatementDataToCsv(todaysStatementData);
    const csvContent = await readFile(csvPath, 'utf8');

    expect(path.basename(csvPath)).toBe(getStatementCsvFileName());
    expect(csvContent).toContain(existingCustomer.phoneNumber);
    expect(csvContent).toContain('Deposit Commission');
    expect(csvContent).toContain(
      expectedBalanceAfterCustomerDeposit.toFixed(2),
    );

    await updateAgentData({ statementCsvFile: path.basename(csvPath) });
  });
});
