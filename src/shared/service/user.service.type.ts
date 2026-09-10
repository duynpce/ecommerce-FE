export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/** Response shape from GET/PUT /v1/users/account-profiles/me */
export interface AccountProfileResponse {
  id:          string;
  userId:      string;
  firstName:   string;
  lastName:    string;
  phoneNumber: string;
  address:     string;
  gender:      Gender;
  createdAt:   string;
  updatedAt:   string;
}

/** Body for PUT /v1/users/account-profiles/me */
export interface UpdateAccountProfileRequest {
  firstName?:   string;
  lastName?:    string;
  phoneNumber?: string;
  address?:     string;
  gender?:      Gender;
}

/** Body for PUT /v1/auth/local/password */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword:     string;
  confirmPassword: string;
}

/** Response shape from GET /v1/users/contributor-profiles/me */
export interface ContributorProfileResponse {
  id:                 string;
  accountId:          string;
  identityCardNumber: string;
  bankName:           string;
  bankAccountNumber:  string;
  taxId:              string;
  createdAt:          string;
  updatedAt:          string;
}

/** Body for PUT /v1/users/contributor-profiles/me */
export interface UpdateContributorProfileRequest {
  bankName?:           string;
  bankAccountNumber?:  string;
  taxId?:              string;
}
