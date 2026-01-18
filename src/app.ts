import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import routes from './app/routes';
import { NotFoundHandler } from './errors/NotFoundHandler';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

export const app: Application = express();

// Add compression FIRST - reduces response size by 60-80%
app.use(compression());

app.use(
  cors({
    origin: [
      'http://192.168.10.16:3000',
      "http://172.252.13.86:4173",
      "https://dashboard.grupoanfguakamol.com",
      "https://www.dashboard.grupoanfguakamol.com",
      'http://localhost:5173',
      'http://10.10.20.70:5173',
      'http://10.10.20.70:5174',
      'http://localhost:5174',
      "http://18.218.29.205:4173"
    ],
    credentials: true,
  }),
);

// Add size limits to prevent hanging requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('uploads'));

app.use('/', routes);

app.get('/', async (req: Request, res: Response) => {
  res.json('Welcome to Business Food Service App');
});

app.use(globalErrorHandler);
app.use(NotFoundHandler.handle);