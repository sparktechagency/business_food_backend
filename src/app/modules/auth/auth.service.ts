import bcrypt from "bcrypt";
import cron from "node-cron";
import httpStatus from "http-status";

import ApiError from "../../../errors/ApiError";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import { logger } from "../../../shared/logger";
import Auth from "./auth.model";

import sendEmail from "../../../utils/sendEmail";
import { ENUM_USER_ROLE } from "../../../enums/user";
import { sendResetEmail } from "./sendResetMails";
import { createActivationToken } from "../../../utils/createActivationToken";
import { resetEmailTemplate } from "../../../mails/reset.email";
import { ActivationPayload, ChangePasswordPayload, ForgotPasswordPayload, IAuth, LoginPayload, ResetPasswordPayload } from "./auth.interface";
import config from "../../../config";

import Admin from "../admin/admin.model";
import { RequestData } from "../../../interfaces/common";
import { IAdmin } from "../admin/admin.interface";
import Employer from "../employer/employer.model";
import { IEmployer } from "../employer/employer.interface";
import { Company } from "../dashboard/dashboard.model";
import { ICompany, IQueryParams } from "../dashboard/dashboard.interface";

const registrationAccount = async (files: any, payload: IAuth) => {
  const { role, password, confirmPassword, email, ...other } = payload;

  if (!role || !Object.values(ENUM_USER_ROLE).includes(role as any)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Valid Role is required!");
  }

  if (!password || !confirmPassword || !email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email, Password, and Confirm Password are required!");
  }

  const existingAuth = await Auth.findOne({ email }).lean();
  if (existingAuth?.isActive) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
  }

  if (existingAuth && !existingAuth.isActive) {
    await Promise.all([
      existingAuth.role === ENUM_USER_ROLE.EMPLOYER && Employer.deleteOne({ authId: existingAuth._id }),
      existingAuth.role === ENUM_USER_ROLE.ADMIN && Admin.deleteOne({ authId: existingAuth._id }),
      Auth.deleteOne({ email }),
    ]);
  }

  let profile_image: string | undefined = undefined;
  if (files && files.profile_image) {
    profile_image = `/images/profile/${files.profile_image[0].filename}`;
  }

  const auth = {
    role,
    name: other.name,
    email,
    profile_image,
    password,
    expirationTime: Date.now() + 3 * 60 * 1000,
  };

  // if (role === ENUM_USER_ROLE.EMPLOYER) {
  //   await sendEmail({
  //     email: auth.email,
  //     subject: "Activate Your Account",
  //     html: registrationSuccessEmailBody({
  //       user: { name: auth.name },
  //       activationCode,
  //     }),
  //   }).catch((error) => console.error("Failed to send email:", error.message));
  // }

  let createAuth = await Auth.create(auth);
  if (!createAuth) {
    throw new ApiError(500, "Failed to create auth account");
  }

  other.authId = createAuth._id;
  other.email = email;
  other.profile_image = profile_image || null;

  let result;
  switch (role) {
    case ENUM_USER_ROLE.EMPLOYER:
      other.status = "pending";
      result = await Employer.create(other);
      break;
    case ENUM_USER_ROLE.ADMIN:
      result = await Admin.create(other);
      break;
    default:
      throw new ApiError(400, "Invalid role provided!");
  }

  const message =
    role === ENUM_USER_ROLE.EMPLOYER
      ? "Your account is awaiting approval from your company."
      : "Your account is awaiting approval from the super admin.";


  return { result, role, message };
};

const activateAccount = async (payload: ActivationPayload) => {
  const { activation_code, userEmail } = payload;
  console.log("activation_code, userEmail", activation_code, userEmail)

  const existAuth = await Auth.findOne({ email: userEmail });
  if (!existAuth) {
    throw new ApiError(400, "User not found");
  }
  if (existAuth.activationCode !== activation_code) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Code didn't match!");
  }
  const user = await Auth.findOneAndUpdate(
    { email: userEmail },
    { isActive: true },
    {
      new: true,
      runValidators: true,
    }
  );

  let result = {} as IEmployer | IAdmin | null;

  if (existAuth.role === ENUM_USER_ROLE.EMPLOYER) {
    result = await Employer.findOne({ authId: existAuth._id });
  } else if (
    existAuth.role === ENUM_USER_ROLE.ADMIN ||
    existAuth.role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    result = await Admin.findOne({ authId: existAuth._id });
  } else {
    throw new ApiError(400, "Invalid role provided!");
  }
  if (!result) {
    throw new ApiError(404, "User details not found");
  }

  const accessToken = jwtHelpers.createToken(
    {
      authId: existAuth._id,
      role: existAuth.role,
      userId: result._id,
    },
    config.jwt.secret as string,
    config.jwt.expires_in as string
  );
  const refreshToken = jwtHelpers.createToken(
    { authId: existAuth._id, userId: result._id, role: existAuth.role },
    config.jwt.refresh_secret as string,
    config.jwt.refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const loginAccount = async (payload: LoginPayload) => {
  const { email, password } = payload;

  const isAuth = await Auth.isAuthExist(email);

  if (!isAuth) {
    throw new ApiError(404, "User does not exist");
  }

  if (!isAuth.isActive) throw new ApiError(401, "Please activate your account then try to login");
  if (isAuth.is_block) throw new ApiError(403, "You are blocked. Contact with your company");

  if (
    isAuth.password &&
    !(await Auth.isPasswordMatched(password, isAuth.password))
  ) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { _id: authId } = isAuth;
  let userDetails: any;
  let role;

  switch (isAuth.role) {
    case ENUM_USER_ROLE.EMPLOYER:
      userDetails = await Employer.findOne({ authId: isAuth._id }).populate("authId");
      const company = await Company.findById(userDetails?.company_id);
      if (!company) throw new ApiError(404, "Your Company does not exist!");
      if (company.status !== "active") throw new ApiError(401, "Your company isn’t active. Please try to login later.");
      role = ENUM_USER_ROLE.EMPLOYER;
      break;
    case ENUM_USER_ROLE.ADMIN:
      userDetails = await Admin.findOne({ authId: isAuth._id }).populate("authId");
      role = ENUM_USER_ROLE.ADMIN;
      break;
    case ENUM_USER_ROLE.COMPANY:
      userDetails = await Company.findOne({ authId: isAuth._id }).populate("authId");
      role = ENUM_USER_ROLE.COMPANY;
      break;
    case ENUM_USER_ROLE.SUPER_ADMIN:
      userDetails = await Admin.findOne({ authId: isAuth._id }).populate("authId");
      role = ENUM_USER_ROLE.SUPER_ADMIN;
      break;
    default:
      throw new ApiError(400, "Invalid role provided!");
  }

  const accessToken = jwtHelpers.createToken(
    { authId, role, userId: userDetails._id },
    config.jwt.secret as string,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { authId, role, userId: userDetails._id },
    config.jwt.refresh_secret as string,
    config.jwt.refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user: userDetails,
  };
};

const forgotPass = async (payload: { email: string }) => {
  const user = await Auth.findOne(
    { email: payload.email },
    { _id: 1, role: 1, email: 1, name: 1 }
  ) as IAuth;

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not exist!");
  }
  if (!user?.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not found!");
  }

  const verifyCode = createActivationToken().activationCode;
  const verifyExpire = new Date(Date.now() + 15 * 60 * 1000);
  user.verifyCode = verifyCode;
  user.verifyExpire = verifyExpire;

  await user.save();

  const data = {
    name: user.name,
    verifyCode,
    verifyExpire: Math.round((verifyExpire.getTime() - Date.now()) / (60 * 1000)),
  };

  try {
    await sendEmail({
      email: payload.email,
      subject: "Password reset code",
      html: resetEmailTemplate(data),
    });
  } catch (error: any) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const checkIsValidForgetActivationCode = async (payload: { email: string; code: string }) => {

  const account: any = await Auth.findOne({ email: payload.email }) as IAuth;
  if (!account) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Account does not exist!");
  }

  if (account.verifyCode !== payload.code) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid reset code!");
  }

  const currentTime = new Date();
  if (currentTime > account.verifyExpire) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Reset code has expired!");
  }
  const update = await Auth.updateOne(
    { email: account.email },
    { codeVerify: true }
  );
  account.verifyCode = null;
  await account.save();
  return update;
};

const resetPassword = async (req: { query: { email: string }; body: ResetPasswordPayload }) => {
  const { email } = req.query;
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Passwords do not match");
  }

  const auth = await Auth.findOne({ email }, { _id: 1, codeVerify: 1 });
  if (!auth) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
  }

  if (!auth.codeVerify) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Your OTP is not verified!");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  const result = await Auth.updateOne(
    { email },
    { password: hashedPassword, codeVerify: false }
  );
  return result;
};

const changePassword = async (user: { authId: string }, payload: ChangePasswordPayload) => {
  const { authId } = user;

  const { oldPassword, newPassword, confirmPassword } = payload;
  if (newPassword !== confirmPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password and confirm password do not match");
  }
  const isUserExist = await Auth.findById(authId).select("+password");
  if (!isUserExist) {
    throw new ApiError(404, "Account does not exist!");
  }
  if (
    isUserExist.password &&
    !(await Auth.isPasswordMatched(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(402, "password is incorrect");
  }


  isUserExist.password = newPassword;
  await isUserExist.save();
  console.log("User saved", isUserExist);

  return { message: "Password changed successfully" };
};

const resendCodeActivationAccount = async (payload: { email: string }) => {
  const email = payload.email;
  const user = await Auth.findOne({ email }) as IAuth;

  if (!user.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email not found!");
  }

  const activationCode = createActivationToken().activationCode;
  const expiryTime = new Date(Date.now() + 3 * 60 * 1000);
  user.activationCode = activationCode;
  user.verifyExpire = expiryTime;
  await user.save();

  console.log('===', email, activationCode, user)

  sendResetEmail(
    user.email,
    `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activation Code</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: auto;
                background: white;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333;
            }
            p {
                color: #555;
                line-height: 1.5;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Hello, ${user.name}</h1>
            <p>Your activation code is: <strong>${activationCode}</strong></p>
            <p>Please use this code to activate your account. If you did not request this, please ignore this email.</p>
            <p>Thank you!</p>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} tayeburrahman.dev</p>
            </div>
        </div>
    </body>
    </html>`
  );
};

const resendCodeForgotAccount = async (payload: ForgotPasswordPayload) => {
  const email = payload.email;

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email not found!");
  }
  const user = await Auth.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
  }
  const verifyCode = createActivationToken().activationCode;
  const expiryTime = new Date(Date.now() + 3 * 60 * 1000);
  user.verifyCode = verifyCode;
  user.verifyExpire = expiryTime;
  await user.save();

  sendResetEmail(
    user.email,
    `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activation Code</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: auto;
                background: white;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333;
            }
            p {
                color: #555;
                line-height: 1.5;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Hello, ${user.name}</h1>
            <p>Your activation code is: <strong>${verifyCode}</strong></p>
            <p>Please use this code to activate your account. If you did not request this, please ignore this email.</p>
            <p>Thank you!</p>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} tayeburrahman.dev</p>
            </div>
        </div>
    </body>
    </html>`
  );
};

// Scheduled task to unset activationCode field
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const result = await Auth.updateMany(
      {
        isActive: false,
        expirationTime: { $lte: now },
        activationCode: { $ne: null },
      },
      {
        $unset: { activationCode: "" },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Removed activation codes from ${result.modifiedCount} expired inactive users`);
    }
  } catch (error) {
    logger.error("Error removing activation codes from expired users:", error);
  }
});

// Scheduled task to unset codeVerify field
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const result = await Auth.updateMany(
      {
        isActive: false,
        verifyExpire: { $lte: now },
      },
      {
        $unset: { codeVerify: false },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Removed activation codes from ${result.modifiedCount} expired inactive users`);
    }
  } catch (error) {
    logger.error("Error removing activation codes from expired users:", error);
  }
});

const myProfile = async (user: { userId: string, role: string }) => {
  const { userId, role } = user;
  let result;
  switch (role) {
    case ENUM_USER_ROLE.EMPLOYER:
      result = await Employer.findById(userId).populate("authId");
      break;
    case ENUM_USER_ROLE.COMPANY:
      result = await Company.findById(userId).populate("authId");
      break;
    case ENUM_USER_ROLE.ADMIN:
      result = await Admin.findById(userId).populate("authId");
      break;
    case ENUM_USER_ROLE.SUPER_ADMIN:
      result = await Admin.findById(userId).populate("authId");
      break;
    default:
      throw new ApiError(400, "Invalid role provided!");
  }
  return result;
};

const deleteMyAccount = async (payload: { authId: string }) => {
  const { authId } = payload;

  const isUserExist = await Auth.findById(authId);

  if (!isUserExist) {
    throw new ApiError(404, "User does not exist");
  }

  let deletedUser = null;

  if (isUserExist.role === ENUM_USER_ROLE.EMPLOYER) {
    deletedUser = await Employer.findOneAndDelete({ authId: isUserExist._id });
  } else if (isUserExist.role === ENUM_USER_ROLE.COMPANY) {
    deletedUser = await Company.findOneAndDelete({ authId: isUserExist._id });
  } else {
    deletedUser = await Admin.findOneAndDelete({ authId: isUserExist._id });
  }

  if (!deletedUser) {
    throw new ApiError(404, "User details not found in Client or Member collection");
  }

  const deletedAuth = await Auth.findByIdAndDelete(authId);

  return {
    message: "Account deleted successfully",
    deletedAuth,
  };
};

const updateMyProfile = async (req: RequestData) => {
  const { files, body: data } = req as any;
  const { userId, authId, role } = req.user;

  if (!Object.keys(data).length && (!files || !files.profile_image)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Data is missing in the request body!");
  }

  const checkAuth = await Auth.findById(authId);
  if (!checkAuth?.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
  }

  let profile_image: string | undefined = undefined;
  if (files && files.profile_image) {
    profile_image = `/images/profile/${files.profile_image[0].filename}`;
  }

  if (role === ENUM_USER_ROLE.EMPLOYER) {
    const customer = await Employer.findById(userId);
    if (!customer) throw new ApiError(httpStatus.NOT_FOUND, "Customer not found!");

    const [updatedAuth, updatedCustomer] = await Promise.all([
      Auth.findByIdAndUpdate(authId, { name: data.name, profile_image }, { new: true }),
      Employer.findByIdAndUpdate(userId, { profile_image, ...data }, { new: true }).populate("authId"),
    ]);

    return updatedCustomer as IEmployer;
  }

  if (role === ENUM_USER_ROLE.COMPANY) {
    const customer = await Company.findById(userId);
    if (!customer) throw new ApiError(httpStatus.NOT_FOUND, "Customer not found!");

    const [updatedAuth, updatedCustomer] = await Promise.all([
      Auth.findByIdAndUpdate(authId, { name: data.name, profile_image }, { new: true }),
      Company.findByIdAndUpdate(userId, { profile_image, ...data }, { new: true }).populate("authId"),
    ]);

    return updatedCustomer as ICompany;
  }

  if (role === ENUM_USER_ROLE.ADMIN || role === ENUM_USER_ROLE.SUPER_ADMIN) {
    const admin = await Admin.findById(userId);
    if (!admin) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");

    const [updatedAuth, updatedAdmin] = await Promise.all([
      Auth.findByIdAndUpdate(authId, { name: data.name, profile_image }, { new: true }),
      Admin.findByIdAndUpdate(userId, { profile_image, ...data }, { new: true }).populate("authId"),
    ]);

    return updatedAdmin as IAdmin;
  }

  throw new ApiError(httpStatus.BAD_REQUEST, "Invalid role");
};

const getAllCompany = async (queryParams: IQueryParams) => {
  const { searchTerm, sortBy = "createdAt", sortOrder = "desc" } = queryParams;

  const searchCondition = searchTerm
    ? {
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { address: { $regex: searchTerm, $options: "i" } },
      ],
    }
    : {};

  const company = await Company.find(searchCondition).sort({
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  });

  return { company };
};


export const AuthService = {
  getAllCompany,
  registrationAccount,
  loginAccount,
  changePassword,
  forgotPass,
  resetPassword,
  activateAccount,
  checkIsValidForgetActivationCode,
  resendCodeActivationAccount,
  resendCodeForgotAccount,
  myProfile,
  deleteMyAccount,
  updateMyProfile
};

