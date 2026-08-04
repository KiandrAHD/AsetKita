export type OtpPurpose = "register" | "reset-password";

export type RegisterPayload = {
    namaLengkap: string;
    namaPanggilan: string;
    email: string;
    nomorHP: string;
    password: string;
};

export type UserProfile = Omit<RegisterPayload, "password"> & {
    uid: string;
    photoURL: string;
    role: "investor";
    status: "aktif";
    emailVerified: boolean;
    provider: "password";
};

export type DemoSession = { nickname: string; isDemo: true };
