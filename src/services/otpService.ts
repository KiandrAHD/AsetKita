import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import type { OtpPurpose, RegisterPayload } from "@/types/auth";

const requestOtpCallable = httpsCallable<{ email: string; purpose: OtpPurpose }, { accepted: boolean; resendAfterSeconds: number }>(functions, "requestEmailOtp");
const completeRegistrationCallable = httpsCallable<RegisterPayload & { otp: string }, { customToken: string }>(functions, "completeRegistration");
const verifyResetCallable = httpsCallable<{ email: string; otp: string }, { resetTicket: string }>(functions, "verifyPasswordResetOtp");
const completeResetCallable = httpsCallable<{ email: string; resetTicket: string; password: string }, { success: boolean }>(functions, "completePasswordReset");
const demoCallable = httpsCallable<{ nickname: string }, { customToken: string }>(functions, "createDemoToken");

export const requestEmailOtp = (email: string, purpose: OtpPurpose) => requestOtpCallable({ email: email.trim(), purpose });
export const completeRegistration = (payload: RegisterPayload, otp: string) => completeRegistrationCallable({ ...payload, otp }).then((result) => result.data);
export const verifyPasswordResetOtp = (email: string, otp: string) => verifyResetCallable({ email: email.trim(), otp }).then((result) => result.data);
export const completePasswordReset = (email: string, resetTicket: string, password: string) => completeResetCallable({ email: email.trim(), resetTicket, password }).then((result) => result.data);
export const createDemoToken = (nickname: string) => demoCallable({ nickname: nickname.trim() }).then((result) => result.data);
