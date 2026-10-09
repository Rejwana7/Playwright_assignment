import { faker } from '@faker-js/faker';
import { generateRandomNumber } from '../utils/randomNumber';

export const adminUser = {
  email: 'admin@dmoney.com',
  password: '1234',
};

export const systemUser = {
  email: 'system@dmoney.com',
  password: '1234',
};

export const existingCustomer = {
  phoneNumber: '01877185247',
};

export const transactionData = {
  systemToAgentAmount: 2000,
  agentToCustomerAmount: 500,
  agentCommissionRate: 0.025,
};

export function createRandomNewPassword(): string {
  const randomNumber = generateRandomNumber(10_000, 99_999);
  return String(randomNumber);
}

export interface AgentTestData {
  fullName: string;
  email: string;
  password: string;
  
  phoneNumber: string;
  nid: string;
  role: 'Agent';
}

const mobilePrefixes = ['013', '014', '015', '016', '017', '018', '019'];

function generatePhoneNumber(): string {
  const prefixIndex = generateRandomNumber(0, mobilePrefixes.length - 1);
  const prefix = mobilePrefixes[prefixIndex];
  const subscriberNumber = generateRandomNumber(10_000_000, 99_999_999);

  return `${prefix}${subscriberNumber}`;
}

function generateNid(): string {
  const length = generateRandomNumber(7, 13);
  let nid = String(generateRandomNumber(1, 9));

  while (nid.length < length) {
    nid += String(generateRandomNumber(0, 9));
  }

  return nid;
}

function generateAgentEmail(): string {
  const baseEmail = process.env.baseEmail;

  if (!baseEmail) {
    throw new Error('baseEmail is missing from the .env file.');
  }

  const uniqueId = `${Date.now()}${generateRandomNumber(10, 99)}`;
  return `${baseEmail}+agent${uniqueId}@gmail.com`;
}

export function createRandomAgent(): AgentTestData {
  return {
    fullName: faker.person.fullName(),
    email: generateAgentEmail(),
    password: '1234',
   
    phoneNumber: generatePhoneNumber(),
    nid: generateNid(),
    role: 'Agent',
  };
}
