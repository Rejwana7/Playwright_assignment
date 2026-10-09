# DMoney Playwright Automation Plan

## Required Page Objects

1. `HomePage`
   - Open the DMoney Portal.
   - Navigate to the Sign Up or Login page.

2. `SignUpPage`
   - Register a new user with the Agent role.
   - Verify successful registration.
   - Verify that the new Agent is initially inactive or pending approval.

3. `LoginPage`
   - Log in as Admin, System, or Agent.
   - Verify successful login.
   - Verify that login with the Agent's old password fails after a password reset.

4. `AdminUserManagementPage`
   - Search for the newly registered Agent.
   - Verify that the Agent appears in the Admin user list.
   - Verify the Agent's inactive status.
   - Activate the Agent account.
   - Verify that the Agent remains active after a page reload.

5. `SystemDashboardPage`
   - Verify successful System login.
   - Navigate to Agent deposit and transaction-history features.

6. `DepositPage`
   - Deposit 2000 Tk from the System account to the Agent.
   - Deposit 500 Tk from the Agent account to an existing Customer.
   - Verify successful transaction messages.

7. `TransactionHistoryPage`
   - Verify the System-to-Agent transaction record.
   - Validate the transaction amount, recipient, type, and status.

8. `AgentDashboardPage`
   - Verify successful Agent login after activation.
   - Verify that the Agent balance is exactly 2000 Tk.
   - Verify the updated Agent balance after depositing 500 Tk to a Customer.

9. `PasswordResetPage`
   - Request or perform an Agent password reset.
   - Verify that the password reset succeeds.

10. `SelfStatementPage`
    - Navigate to the Self Statement section.
    - Verify the expected transaction data.
    - Extract every available table row.
    - Provide the extracted data for CSV export.

## Reusable Component

### `NavigationComponent` or `SidebarComponent`

- Navigate between dashboard sections.
- Log out from Admin, System, and Agent accounts.

## Utility

### `CsvHelper`

- Convert the extracted Self Statement data into CSV format.
- Save the file using `self_statement_YYYY-MM-DD.csv`.
- Verify that the expected CSV file was created successfully.

## Positive Smoke Suite Scope

The positive-only smoke suite will include:

1. Register a new Agent successfully.
2. Verify the expected initial inactive status.
3. Log in as Admin successfully.
4. Find and activate the new Agent.
5. Verify that activation persists after a page reload.
6. Log in as System successfully.
7. Deposit 2000 Tk into the Agent account successfully.
8. Verify the System-to-Agent transaction record.
9. Log in as the activated Agent successfully.
10. Verify that the Agent balance is exactly 2000 Tk.
11. Deposit 500 Tk from the Agent to an existing Customer successfully.
12. Verify the updated Agent balance and Self Statement transaction.
13. Log out from the Agent account successfully.
14. Reset the Agent password successfully.
15. Log in successfully with the new password.
16. Extract the Self Statement and save it to the required CSV file.

The old-password login failure validation remains part of the full regression suite because it is a negative test and is therefore excluded from the positive-only smoke suite.
