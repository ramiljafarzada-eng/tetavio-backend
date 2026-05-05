import { SetMetadata } from '@nestjs/common';

export type HrmScope = 'SELF_ONLY' | 'DEPT_ONLY' | 'ACCOUNT_ALL';

export const HRM_SCOPE_KEY = 'hrm_scope';
export const HrmScopes = (...scopes: HrmScope[]) =>
  SetMetadata(HRM_SCOPE_KEY, scopes);
