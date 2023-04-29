import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { URL, URLSearchParams } from 'url';
import axios from 'axios';

declare module 'express-session' {
  interface SessionData {
    accessToken: any;
  }
}

dotenv.config();

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'secret';
const OAUTH_DOMAIN = process.env.OAUTH_DOMAIN || '';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const SCOPES = process.env.SCOPES || 'openid profile email';

const app = express();

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

app.get('/page', (req: Request, res: Response) => {
  res.send(`<h1>Hello</h1><p>Auth</p>`);
});
app.get('/token', async (req: Request, res: Response) => {
  const tokenResponse = await axios({
    method: 'post',
    url: `${OAUTH_DOMAIN}/connect/token/client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials&scope=${SCOPES}`,
    headers: {
      Accept: 'application/json'
    }
  });
  console.log(tokenResponse);
  res.send(`<h1>Hello</h1><p>Auth</p>`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
