import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import NexarClient from './NexarClient';
import * as fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

const filePath = path.resolve(__dirname, 'files');
const watcher = chokidar.watch('D:/files');

watcher.on('change', () => {
  console.log('file have been changed!');
  delete require.cache[require.resolve(filePath)];
  const updatedFile = require(filePath);
  console.log(updatedFile);
});

const clientId = '6ef185a4-cca8-4f35-83d5-28a72c5e95a4';
const clientSecret = 'TefLdQKEnZCSRbtrCkPUYpM3FppCCsBn1k5L';
const nexar = new NexarClient(clientId, clientSecret, 'openid profile email design.domain user.access offline_access');
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
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/data', async (req, res) => {
  try {
    let workspaces = nexar.query(gqlQuery, undefined).then((response) => response.data.desWorkspaces);
    workspaces.then(async (workspaces) => {
      console.log(JSON.stringify(workspaces));

      res.send(workspaces);
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(8000, () => {
  console.log('Server started on port 8000!');
});
