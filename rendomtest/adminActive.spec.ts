import { test } from '@playwright/test';
import { AdminUserManagementPage } from '../pages/AdminUserManagementPage';
import { LoginPage } from '../pages/LoginPage';
import { adminUser } from '../test_data/testData';
import { readAgentData, updateAgentData } from '../utils/agentJson';

test.describe('Admin Agent activation', () => {
  test('Admin activates a newly registered Agent and logs out @smoke @positive', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminUserManagementPage(page);
    const agent = await readAgentData();

    await loginPage.open();
    await loginPage.login(adminUser.email, adminUser.password);
    await loginPage.verifyAdminLoginIsSuccessful();

    await adminPage.open();
    await adminPage.searchAgentByEmail(agent.email);
    await adminPage.verifyAgentIsListedAndPending(agent.email);
    await adminPage.activateAgent(agent.email);
    await adminPage.verifyAgentRemainsActiveAfterReload();
    await updateAgentData({ status: 'active' });
    await adminPage.logout();
  });
});
