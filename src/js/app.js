/* eslint-disable consistent-return */
import moment from 'moment';

const urlHttp = 'https://sse-3.herokuapp.com/instances';
// const urlHttp = 'http://localhost:7070/instances';

const drawList = async () => {
  const response = await fetch(urlHttp);
  const instancesArray = await response.json();

  const instanceList = document.querySelector('.instance-list');
  instanceList.innerHTML = '';
  for (const item of instancesArray) {
    const instanceLi = document.createElement('li');
    instanceLi.className = `instance-item ${item.state}`;
    instanceLi.innerHTML = `
            <span class="instance-id">${item.id}</span>
            <span class="instance-status">
              Status: 
              <span class="status"></span>
            </span>
            <span class="instance-actions">
              Actions: 
              <div class="stop-start status-icon"></div>
              <div class="close status-icon"></div>
           </span>`;
    instanceList.appendChild(instanceLi);
  }
};

export default class Dashboard {
  constructor() {
    this.url = 'wss://sse-3.herokuapp.com/ws';
    // this.url = 'ws://localhost:7070/ws';
  }

  init() {
    this.instancesForm = document.getElementById('instances');

    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      console.log('connected');
    });

    this.ws.addEventListener('message', (event) => {
      console.log('message');
      this.drawMessage(event);
    });

    this.ws.addEventListener('close', (event) => {
      console.log('connection closed', event);
    });

    this.ws.addEventListener('error', () => {
      console.log('error');
    });

    this.events();

    this.dashboardForm = document.querySelector('.dashboard');
    this.worklogList = document.querySelector('#worklog-list');
    this.dashboardForm.classList.remove('hidden');

    drawList();

    window.addEventListener('beforeunload', () => {
      this.ws.close(1000, 'finish');
      fetch(`${urlHttp}/${this.nameUser}`, {
        method: 'DELETE',
      });
      drawList();
    });
  }

  events() {
    this.instancesForm.addEventListener('click', (event) => {
      event.preventDefault();

      const targetClassList = event.target.classList;
      if (targetClassList.contains('new-instance')) {
        return fetch(urlHttp, {
          method: 'POST',
        });
      }
      if (targetClassList.contains('stop-start')) {
        const idPatch = event.target
          .closest('.instance-item')
          .querySelector('.instance-id').innerText;

        return fetch(`${urlHttp}/${idPatch}`, {
          method: 'PATCH',
        });
      }
      if (targetClassList.contains('close')) {
        const idPatch = event.target
          .closest('.instance-item')
          .querySelector('.instance-id').innerText;

        return fetch(`${urlHttp}/${idPatch}`, {
          method: 'DELETE',
        });
      }
    });
  }

  drawMessage(message) {
    const { type } = JSON.parse(message.data);

    if (type === 'message') {
      const { name, mess, dateTime } = JSON.parse(message.data);

      const instanceItem = document.createElement('li');
      instanceItem.className = 'instance-i';

      instanceItem.innerHTML = `
              <div class="header">
                <span>${moment(dateTime).format('HH:mm:ss DD.MM.YY')}</span>
              </div>
              <div class="instance-i">
                <span>Server: ${name}</span>
                INFO: ${mess}
              </div>`;

      drawList();

      this.worklogList.appendChild(instanceItem);
      this.worklogList.scrollTo(0, instanceItem.offsetTop);
    }
  }

  sendMessage(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      const messageItem = {
        type: 'change',
        name: this.nameUser,
        mess: message,
        dateTime: new Date(),
      };
      const json = JSON.stringify(messageItem);
      this.ws.send(json);

      try {
        const mess = {
          type: 'message',
          name: this.nameUser,
          mess: message,
          dateTime: new Date(),
        };
        const jsonMess = JSON.stringify(mess);
        this.ws.send(jsonMess);
      } catch (err) {
        console.log(`Ошибка! - ${err}`);
      }
    } else {
      console.log('reconect');
      this.ws = new WebSocket(this.url);
    }
  }
}

const board = new Dashboard();
board.init();
