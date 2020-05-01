/* eslint-disable no-unused-vars */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */
/* eslint-disable no-shadow */

const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const uuid = require('uuid');
const WS = require('ws');

const app = new Koa();

// CORS
app.use(async(ctx, next) => {
    const origin = ctx.request.get('Origin');
    if (!origin) {
        return await next();
    }

    const headers = { 'Access-Control-Allow-Origin': '*' };

    if (ctx.request.method !== 'OPTIONS') {
        ctx.response.set({...headers });
        try {
            return await next();
        } catch (e) {
            e.headers = {...e.headers, ...headers };
            throw e;
        }
    }

    if (ctx.request.get('Access-Control-Request-Method')) {
        ctx.response.set({
            ...headers,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
        });

        if (ctx.request.get('Access-Control-Request-Headers')) {
            ctx.response.set(
                'Access-Control-Allow-Headers',
                ctx.request.get('Access-Control-Request-Headers'),
            );
        }

        ctx.response.status = 204;
    }
});

app.use(
    koaBody({
        text: true,
        urlencoded: true,
        multipart: true,
        json: true,
    }),
);

const router = new Router();
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

const instance = [];

function sendMessage(id, text) {
    try {
        const message = JSON.stringify({
            type: 'message',
            name: id,
            mess: text,
            dateTime: new Date(),
        });
        [...wsServer.clients][0].send(message);
    } catch (err) {
        console.log(`Ошибка! - ${err}`);
    }
}

router
    .get('/instances', async(ctx, next) => {
        console.log('get');
        ctx.response.body = instance;
    })
    .post('/instances', async(ctx, next) => {
        console.log('post');
        const id = uuid.v4();
        sendMessage(id, 'Received "Create command"');

        setTimeout(() => {
            instance.push({ id, state: 'Stopped' });
            sendMessage(id, 'Created');
        }, 2000);

        ctx.response.body = { status: 'ok' };
    })
    .patch('/instances/:id', async(ctx, next) => {
        console.log('patch');

        sendMessage(ctx.params.id, 'Received "Change State"');

        const index = instance.findIndex((item) => item.id === ctx.params.id);
        if (index !== -1) {
            setTimeout(() => {
                let current = instance[index].state;
                current = current === 'Stopped' ? 'Started' : 'Stopped';
                instance[index].state = current;
                sendMessage(ctx.params.id, current);
            }, 2000);
        }
        ctx.response.body = {
            status: 'ok',
        };
    })
    .delete('/instances/:id', async(ctx, next) => {
        console.log('delete');
        const index = instance.findIndex((item) => item.id === ctx.params.id);

        if (index !== -1) {
            sendMessage(ctx.params.id, 'Received "Delete instace"');
            setTimeout(() => {
                instance.splice(index, 1);
                sendMessage(ctx.params.id, 'Deleted');
            }, 2000);
        }
        ctx.response.body = {
            status: 'ok',
        };
    });

wsServer.on('connection', (ws, request) => {
    console.log('connection');
    ws.on('message', (mess) => {
        console.log('message');
        [...wsServer.clients]
        .filter((o) => o.readyState === WS.OPEN)
            .forEach((o) => o.send(mess));
    });
    ws.on('close', () => {
        console.log('close');
        [...wsServer.clients]
        .filter((o) => o.readyState === WS.OPEN)
            .forEach((o) => o.send(JSON.stringify({ type: 'deleting' })));
    });
    ws.on('change', () => {
        console.log('change');
    });

    [...wsServer.clients]
    .filter((o) => o.readyState === WS.OPEN)
        .forEach((o) => o.send(JSON.stringify({ type: 'adding' })));
});

app.use(router.routes()).use(router.allowedMethods());
const port = process.env.PORT || 7070;
server.listen(port);