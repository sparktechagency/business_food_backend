import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import Auth from '../auth/auth.model';
import { IReqUser } from '../auth/auth.interface';
import { RequestData } from '../../../interfaces/common';

interface DeleteAccountPayload {
  email: string;
  password: string;
}



export const AgentService = {
};

