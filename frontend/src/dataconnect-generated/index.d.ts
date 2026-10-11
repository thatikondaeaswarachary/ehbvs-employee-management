import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Announcement_Key {
  id: UUIDString;
  __typename?: 'Announcement_Key';
}

export interface Attendance_Key {
  id: UUIDString;
  __typename?: 'Attendance_Key';
}

export interface AuditLog_Key {
  id: UUIDString;
  __typename?: 'AuditLog_Key';
}

export interface GetUserByEmailData {
  users: ({
    id: UUIDString;
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string | null;
    isActive: boolean;
  } & User_Key)[];
}

export interface GetUserByEmailVariables {
  email: string;
}

export interface Leave_Key {
  id: UUIDString;
  __typename?: 'Leave_Key';
}

export interface ListEmployeesData {
  users: ({
    id: UUIDString;
    name: string;
    email: string;
    role: string;
    department?: string | null;
    designation?: string | null;
    isActive: boolean;
    workStatus?: string | null;
  } & User_Key)[];
}

export interface Notification_Key {
  id: UUIDString;
  __typename?: 'Notification_Key';
}

export interface Setting_Key {
  id: UUIDString;
  __typename?: 'Setting_Key';
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface WorkReport_Key {
  id: UUIDString;
  __typename?: 'WorkReport_Key';
}

interface ListEmployeesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEmployeesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListEmployeesData, undefined>;
  operationName: string;
}
export const listEmployeesRef: ListEmployeesRef;

export function listEmployees(options?: ExecuteQueryOptions): QueryPromise<ListEmployeesData, undefined>;
export function listEmployees(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListEmployeesData, undefined>;

interface GetUserByEmailRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserByEmailVariables): QueryRef<GetUserByEmailData, GetUserByEmailVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserByEmailVariables): QueryRef<GetUserByEmailData, GetUserByEmailVariables>;
  operationName: string;
}
export const getUserByEmailRef: GetUserByEmailRef;

export function getUserByEmail(vars: GetUserByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByEmailData, GetUserByEmailVariables>;
export function getUserByEmail(dc: DataConnect, vars: GetUserByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByEmailData, GetUserByEmailVariables>;

