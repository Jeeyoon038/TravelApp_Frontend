// ./types/googleUserInfo.ts
export interface GoogleUserInfo { 
    sub: string;
    email: string;
    name: string;
    picture: string;
    given_name?: string;
    family_name?: string;
}
