import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { URL, URLSearchParams } from 'url';

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

const checkAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session.accessToken) {
      console.log('No access token');
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const checkAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.accessToken) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};

const checkNotAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.accessToken) {
    res.redirect('/');
  } else {
    next();
  }
};

const router = express.Router();

router.get('/', checkAuthenticated, (req: Request, res: Response) => {
  res.send(`<h1>Hello</h1><p>Auth</p>`);
});

router.get('/api/data', checkAccessToken, async (req: Request, res: Response) => {
  const gqlQuery = `query workspaces {
  desWorkspaces {
    id
    name
    description
    url
    projects {
      id
      name
      design {
        releases {
          nodes {
            variants {
              pcbFabrication {
                gerber {
                  packageName
                  downloadUrl
                }
              }
            }
          }
        }
      }
    }
  }
}
`;
  const data = {
    query: gqlQuery,
    variables: undefined
  };
  const response = await fetch('api.nexar.com/graphql', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + req.session.accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  console.log(response);
  res.json('11');
});

router.get('/auth/login', checkNotAuthenticated, (req: Request, res: Response) => {
  let urlSafe = (buffer) => buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  let pkceVerifier = urlSafe(crypto.randomBytes(40));
  let pkceChallenge = urlSafe(crypto.createHash('sha256').update(pkceVerifier).digest());
  let auth_request = new URL(`${OAUTH_DOMAIN}/connect/authorize`);

  const auth_params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: crypto.randomBytes(16).toString('hex'),
    code_challenge: pkceChallenge,
    code_challenge_method: 'S256'
  });
  auth_request.search = auth_params.toString();
  res.redirect(auth_request.href);
});

router.get('/auth/callback', checkNotAuthenticated, async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    const tokenUrl = `${OAUTH_DOMAIN}/connect/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    });
    const data: any = await response.json();
    req.session.accessToken = data.access_token;
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/auth/logout', checkAuthenticated, (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

app.use('/', router);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
